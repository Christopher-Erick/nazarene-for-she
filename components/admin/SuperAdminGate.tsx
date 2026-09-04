import { cookies } from "next/headers";
import { getDb } from "@/lib/cms/db";
import { isSuperAdmin, loadAuth, SESSION_COOKIE } from "@/lib/cms/auth";

export async function SuperAdminGate({ children }: { children: React.ReactNode }) {
  const db = await getDb();
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const auth = db ? await loadAuth(db, token) : null;
  if (!auth || !isSuperAdmin(auth)) {
    return <p className="admin-flash">You do not have access to this resource.</p>;
  }
  return children;
}
