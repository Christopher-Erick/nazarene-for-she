/**
 * Set a new password for an admin account directly in the production D1 database, or,
 * when the database has no accounts yet, create the first Super Admin.
 * For when nobody can sign in.
 *
 *   npx wrangler login            (once, opens the browser)
 *   npm run admin:reset-password
 *
 * Add --local to change the local Wrangler database instead of production.
 * The password is typed here, hidden, hashed on this computer, and never printed.
 */
import { execFileSync } from "node:child_process";
import path from "node:path";
import { createInterface } from "node:readline";
import { fileURLToPath } from "node:url";

const DB_NAME = "nazarene-for-she";
const ITERATIONS = 100_000; // must match lib/cms/password.ts (Cloudflare Workers allow at most 100,000)
const KEY_LENGTH = 32;
const target = process.argv.includes("--local") ? "--local" : "--remote";

// One reader for every question, so answers typed (or piped) ahead are not lost between prompts.
let reader = null;
let lines = null;

function ask(question, { hidden = false } = {}) {
  if (!reader) {
    reader = createInterface({ input: process.stdin, output: process.stdout, terminal: Boolean(process.stdin.isTTY) });
    lines = reader[Symbol.asyncIterator]();
  }
  const write = reader._writeToOutput;
  process.stdout.write(question);
  if (hidden) {
    reader._writeToOutput = (text) => {
      if (text.includes("\n") || text.includes("\r")) reader.output.write("\n");
      else reader.output.write("*".repeat(text.length));
    };
  }
  return lines.next().then(({ value }) => {
    reader._writeToOutput = write;
    if (hidden && !process.stdin.isTTY) process.stdout.write("\n");
    return value ?? "";
  });
}

function closeInput() {
  reader?.close();
}

function meetsPolicy(password) {
  return (
    password.length >= 14 &&
    password.length <= 128 &&
    /[a-z]/.test(password) &&
    /[A-Z]/.test(password) &&
    /[0-9]/.test(password) &&
    /[^A-Za-z0-9]/.test(password)
  );
}

export async function hashPassword(password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const material = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, [
    "deriveBits",
  ]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt, iterations: ITERATIONS },
    material,
    KEY_LENGTH * 8,
  );
  const b64 = (bytes) => Buffer.from(bytes).toString("base64");
  return `pbkdf2$sha256$${ITERATIONS}$${b64(salt)}$${b64(new Uint8Array(bits))}`;
}

function sqlString(value) {
  return `'${String(value).replace(/'/g, "''")}'`;
}

const WRANGLER = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "node_modules", "wrangler", "bin", "wrangler.js");

/** Runs SQL through the local Wrangler CLI with Node directly, so no shell ever sees the SQL. */
function d1(sql) {
  const out = execFileSync(process.execPath, [WRANGLER, "d1", "execute", DB_NAME, target, "--json", "--command", sql], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "inherit"],
  });
  const parsed = JSON.parse(out.slice(out.indexOf("[")));
  return parsed.flatMap((entry) => entry.results ?? []);
}

/** Asks twice (hidden) and returns the hash, or exits without changing anything. */
async function askNewPasswordHash() {
  console.log("New password: at least 14 characters with upper and lower case, a number and a symbol.");
  const password = await ask("New password: ", { hidden: true });
  if (!meetsPolicy(password)) {
    console.error("That password does not meet the policy. Nothing was changed.");
    process.exit(1);
  }
  const again = await ask("Type it again: ", { hidden: true });
  if (again !== password) {
    console.error("The passwords did not match. Nothing was changed.");
    process.exit(1);
  }
  return hashPassword(password);
}

/** Only when the database has no accounts at all: create the first Super Admin (like /api/v1/admin/bootstrap). */
async function createFirstSuperAdmin(email) {
  console.log("\nThis database has no admin accounts yet.");
  const answer = (await ask(`Create the first Super Admin as ${email}? (yes/no): `)).trim().toLowerCase();
  if (answer !== "yes" && answer !== "y") {
    console.log("Nothing was changed.");
    process.exit(1);
  }
  const name = (await ask("Your name as it should appear in the admin: ")).trim().slice(0, 120) || "Super Admin";
  const hash = await askNewPasswordHash();
  const id = crypto.randomUUID();
  const now = Date.now();
  d1(
    [
      `INSERT INTO users (id, name, email, password_hash, status, created_at, updated_at) VALUES (${sqlString(id)}, ${sqlString(name)}, ${sqlString(email)}, ${sqlString(hash)}, 'active', ${now}, ${now});`,
      `INSERT INTO user_roles (user_id, role_id) VALUES (${sqlString(id)}, 'super_admin');`,
      `INSERT INTO audit_logs (id, user_id, action, resource_type, resource_id, metadata, ip, created_at) VALUES (${sqlString(crypto.randomUUID())}, ${sqlString(id)}, 'USER_CREATED', 'user', ${sqlString(id)}, '{"bootstrap":"cli"}', '', ${now});`,
    ].join("\n"),
  );
  console.log(`\nSuper Admin created for ${email}${target === "--local" ? " (local database)" : ""}. Sign in at /admin/login.`);
}

async function main() {
  const email = (await ask("Admin email: ")).trim().toLowerCase();
  if (!/^[^\s@'"<>]+@[^\s@'"<>]+\.[A-Za-z]{2,}$/.test(email)) {
    console.error("That does not look like an email address. Nothing was changed.");
    process.exit(1);
  }
  const users = d1(
    `SELECT u.id, u.name, u.status FROM users u WHERE lower(u.email) = ${sqlString(email)};`,
  );
  if (!users.length) {
    const all = d1("SELECT email, status FROM users ORDER BY created_at;");
    if (!all.length) return createFirstSuperAdmin(email);
    console.error(`\nNo account uses ${email}. Accounts in the database:`);
    for (const row of all) console.error(`  ${row.email} (${row.status})`);
    process.exit(1);
  }
  const user = users[0];
  console.log(`Found ${user.name} (${user.status}).`);

  const hash = await askNewPasswordHash();
  const now = Date.now();
  const id = sqlString(user.id);
  d1(
    [
      `UPDATE users SET password_hash = ${sqlString(hash)}, status = 'active', updated_at = ${now} WHERE id = ${id};`,
      // Sign out old sessions and clear the failed-login lockout for this account.
      `DELETE FROM sessions WHERE user_id = ${id};`,
      `DELETE FROM login_attempts WHERE lower(email) = ${sqlString(email)};`,
    ].join("\n"),
  );
  console.log(`\nPassword updated for ${email}${target === "--local" ? " (local database)" : ""}. Sign in at /admin/login.`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main()
    .then(closeInput)
    .catch((error) => {
      console.error(error instanceof Error ? error.message : error);
      process.exit(1);
    });
}
