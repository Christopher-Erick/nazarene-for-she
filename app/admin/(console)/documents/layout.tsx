import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getDb } from "@/lib/cms/db";
import { loadAuth, PREVIEW_COOKIE, SESSION_COOKIE } from "@/lib/cms/auth";
import { loadOfficerContext } from "@/lib/cms/document-store";

export default async function DocumentsLayout({ children }: { children: React.ReactNode }) {
  const db = await getDb();
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  const auth = db ? await loadAuth(db, token, jar.get(PREVIEW_COOKIE)?.value) : null;
  if (!auth) redirect("/admin/login");
  if (db) {
    const desk = await loadOfficerContext(db, auth);
    if (!desk.allowed) redirect("/admin");
  }
  return children;
}
