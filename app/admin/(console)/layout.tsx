import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { getDb } from "@/lib/cms/db";
import { loadAuth, SESSION_COOKIE } from "@/lib/cms/auth";
import { navFor } from "@/lib/cms/nav";

export default async function ConsoleLayout({ children }: { children: React.ReactNode }) {
  const db = await getDb();
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const auth = db ? await loadAuth(db, token) : null;
  if (!auth) redirect("/admin/login");

  return (
    <AdminShell
      userName={auth.user.name}
      roleName={auth.user.role_name}
      nav={navFor(auth).map((item) => ({ href: item.href, label: item.label, group: item.group }))}
    >
      {children}
    </AdminShell>
  );
}
