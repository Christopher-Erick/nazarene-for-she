import { execSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const wranglerPath = path.join(root, "wrangler.jsonc");
const DB_NAME = "nazarene-for-she";
const BUCKET_NAME = "nazarene-for-she-media";

function wrangler(args, { allowFail = false } = {}) {
  try {
    return execSync(`npx wrangler ${args}`, {
      cwd: root,
      encoding: "utf8",
      env: process.env,
      stdio: ["ignore", "pipe", "pipe"],
    });
  } catch (error) {
    const out = `${error.stdout ?? ""}\n${error.stderr ?? ""}`;
    if (allowFail) return out;
    throw new Error(out.trim() || error.message);
  }
}

function extractJson(text) {
  const arrayStart = text.indexOf("[");
  const objectStart = text.indexOf("{");
  const start =
    arrayStart >= 0 && (objectStart < 0 || arrayStart < objectStart) ? arrayStart : objectStart;
  if (start < 0) return null;
  const endChar = text[start] === "[" ? "]" : "}";
  const end = text.lastIndexOf(endChar);
  if (end <= start) return null;
  try {
    return JSON.parse(text.slice(start, end + 1));
  } catch {
    return null;
  }
}

function databaseIdFrom(value) {
  if (!value || typeof value !== "object") return "";
  return String(value.uuid ?? value.id ?? value.database_id ?? "");
}

function findDatabase() {
  const raw = wrangler("d1 list --json");
  const parsed = extractJson(raw);
  const rows = Array.isArray(parsed) ? parsed : parsed?.result ?? parsed?.databases ?? [];
  return rows.find((row) => row?.name === DB_NAME) ?? null;
}

function createDatabase() {
  const out = wrangler(`d1 create ${DB_NAME}`);
  process.stdout.write(out);
  const existing = findDatabase();
  if (existing) return existing;
  const match = out.match(/database_id["'\s:=]+([0-9a-f-]{36})/i);
  if (!match) {
    throw new Error("Created D1, but could not read its id from Wrangler output.");
  }
  return { name: DB_NAME, uuid: match[1] };
}

function bucketExists() {
  const out = wrangler("r2 bucket list", { allowFail: true });
  return out.toLowerCase().includes(BUCKET_NAME);
}

function createBucket() {
  if (bucketExists()) {
    process.stdout.write(`R2 bucket ${BUCKET_NAME} already exists.\n`);
    return;
  }
  try {
    const out = wrangler(`r2 bucket create ${BUCKET_NAME}`);
    process.stdout.write(out);
  } catch (error) {
    const text = String(error.message);
    if (/10042|enable R2/i.test(text)) {
      throw new Error(
        "Cloudflare R2 is not enabled on this account. In the Cloudflare dashboard open R2, choose Get started, then run this again.",
      );
    }
    if (/already exists|409/i.test(text)) return;
    throw error;
  }
}

function writeWranglerConfig(databaseId, includeR2) {
  const config = {
    $schema: "node_modules/wrangler/config-schema.json",
    name: "nazarene-for-she",
    main: ".open-next/worker.js",
    compatibility_date: "2026-08-19",
    compatibility_flags: ["nodejs_compat", "global_fetch_strictly_public"],
    assets: {
      directory: ".open-next/assets",
      binding: "ASSETS",
    },
    services: [
      {
        binding: "WORKER_SELF_REFERENCE",
        service: "nazarene-for-she",
      },
    ],
    d1_databases: [
      {
        binding: "DB",
        database_name: DB_NAME,
        database_id: databaseId,
        migrations_dir: "migrations",
      },
    ],
  };
  if (includeR2) {
    config.r2_buckets = [
      {
        binding: "MEDIA",
        bucket_name: BUCKET_NAME,
      },
    ];
  }
  writeFileSync(wranglerPath, `${JSON.stringify(config, null, 2)}\n`);
}

const existing = findDatabase();
const database = existing ?? createDatabase();
const databaseId = databaseIdFrom(database);
if (!databaseId) {
  throw new Error("D1 database exists, but Wrangler did not return an id.");
}
process.stdout.write(`D1 ${DB_NAME} id: ${databaseId}\n`);
let r2Ready = false;
try {
  createBucket();
  r2Ready = true;
} catch (error) {
  process.stderr.write(`${error instanceof Error ? error.message : error}\n`);
  process.stderr.write("Continuing with D1 only. Enable R2, then run this script again.\n");
}
writeWranglerConfig(databaseId, r2Ready);
process.stdout.write(`Updated ${path.relative(root, wranglerPath)}\n`);
if (!r2Ready) process.exitCode = 2;
