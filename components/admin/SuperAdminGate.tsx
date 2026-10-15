import { cookies } from "next/headers";
import { getDb } from "@/lib/cms/db";
import { isSuperAdmin, loadAuth, PREVIEW_COOKIE, SESSION_COOKIE } from "@/lib/cms/auth";

export async function SuperAdminGate({ children }: { children: React.ReactNode }) {
  const db = await getDb();
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  const auth = db ? await loadAuth(db, token, jar.get(PREVIEW_COOKIE)?.value) : null;
  if (!auth || !isSuperAdmin(auth)) {
    return <p className="admin-flash admin-flash--error">You do not have access to this resource.</p>;
  }
  return children;
}
