import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { getDb } from "@/lib/cms/db";
import { isSuperAdmin, loadAuth, PREVIEW_COOKIE, SESSION_COOKIE } from "@/lib/cms/auth";
import { navFor } from "@/lib/cms/nav";
import { listAssignableRoles } from "@/lib/cms/roles";

/**
 * Layouts do not re-render on client navigation, so the per-page "is this on
 * your desk" check lives in AdminShell (it follows usePathname). Every admin API
 * still enforces permissions on its own.
 */
export default async function ConsoleLayout({ children }: { children: React.ReactNode }) {
  const db = await getDb();
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  const auth = db ? await loadAuth(db, token, jar.get(PREVIEW_COOKIE)?.value) : null;
  if (!auth) redirect("/admin/login");
  const canPreview = isSuperAdmin(auth) || Boolean(auth.preview);
  const previewRoles = canPreview && db ? (await listAssignableRoles(db)).map((role) => ({ slug: role.slug, name: role.name })) : [];

  return (
    <AdminShell
      userName={auth.user.name}
      roleName={auth.user.role_name}
      canPreview={canPreview}
      previewRoles={previewRoles}
      previewRoleName={auth.preview ? auth.user.role_name : null}
      nav={navFor(auth).map((item) => ({ href: item.href, label: item.label, group: item.group }))}
    >
      {children}
    </AdminShell>
  );
}
