import { getDb, queryFirst } from "@/lib/cms/db";
import { hashPassword, passwordMeetsPolicy } from "@/lib/cms/password";
import { audit } from "@/lib/cms/audit";
import { nowMs, newId, run } from "@/lib/cms/db";
import { jsonNoStore, rateLimit, clientKey, isSameOrigin } from "@/lib/security";
import { parseBody, requestIp } from "@/lib/cms/http";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return jsonNoStore({ ok: false, message: "This action can only be completed from the admin site." }, { status: 403 });
  }

  const limited = rateLimit(`bootstrap:${clientKey(request)}`, 5, 60 * 60 * 1000);
  if (!limited.ok) {
    return jsonNoStore({ ok: false, message: "Please wait before trying again." }, { status: 429 });
  }

  const expected = process.env.CMS_BOOTSTRAP_TOKEN?.trim();
  if (!expected || expected.length < 24) {
    return jsonNoStore({ ok: false, message: "Bootstrap is not configured." }, { status: 403 });
  }
  const provided = request.headers.get("x-bootstrap-token") ?? "";
  if (provided !== expected) {
    return jsonNoStore({ ok: false, message: "Bootstrap is not configured." }, { status: 403 });
  }

  const db = await getDb();
  if (!db) return jsonNoStore({ ok: false, message: "The content database is not configured." }, { status: 503 });

  const existing = await queryFirst<{ n: number }>(db, "SELECT COUNT(*) AS n FROM users");
  if ((existing?.n ?? 0) > 0) {
    return jsonNoStore({ ok: false, message: "The first administrator has already been created." }, { status: 409 });
  }

  const body = await parseBody(request);
  if (!body.ok) return body.response;

  const email = String(body.data.email ?? "").toLowerCase().trim();
  const name = String(body.data.name ?? "Super Admin").trim().slice(0, 120);
  const password = String(body.data.password ?? "");
  if (!email || !email.includes("@")) {
    return jsonNoStore({ ok: false, message: "A valid email is required." }, { status: 400 });
  }
  if (!passwordMeetsPolicy(password)) {
    return jsonNoStore(
      {
        ok: false,
        message: "Password must be at least 14 characters and include upper, lower, number, and symbol.",
      },
      { status: 400 },
    );
  }

  const id = newId();
  const now = nowMs();
  await run(
    db,
    "INSERT INTO users (id, name, email, password_hash, status, created_at, updated_at) VALUES (?, ?, ?, ?, 'active', ?, ?)",
    id,
    name,
    email,
    await hashPassword(password),
    now,
    now,
  );
  await run(db, "INSERT INTO user_roles (user_id, role_id) VALUES (?, 'super_admin')", id);
  await audit({
    db,
    userId: id,
    action: "USER_CREATED",
    resourceType: "user",
    resourceId: id,
    metadata: { bootstrap: true },
    ip: requestIp(request),
  });

  return jsonNoStore({ ok: true, message: "Super Admin created. You can sign in at /admin/login." }, { status: 201 });
}
