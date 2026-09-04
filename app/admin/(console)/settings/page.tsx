import Link from "next/link";
import { AdminHeader } from "@/components/admin/AdminHeader";

const LINKS = [
  {
    href: "/admin/organization",
    title: "Organization",
    body: "Who we are, mission and vision — the copy on Why We Exist.",
  },
  {
    href: "/admin/donations",
    title: "Donations",
    body: "Support A Girl opening copy and official payment details.",
  },
  {
    href: "/admin/pages",
    title: "Site pages",
    body: "About, Get Involved, Partnership and Terms.",
  },
  {
    href: "/admin/seo",
    title: "Search defaults",
    body: "Title and description used when a page does not set its own.",
  },
  {
    href: "/admin/privacy",
    title: "Privacy",
    body: "The public privacy policy.",
  },
  {
    href: "/admin/maintenance",
    title: "Maintenance",
    body: "Take the public site offline. Super Admin only.",
  },
];

export default function SettingsPage() {
  return (
    <div className="admin-stack">
      <AdminHeader kicker="Housekeeping" title="Settings">
        <p>Choose the part of the public site you want to look after. Nothing here is a database table.</p>
      </AdminHeader>
      <div className="admin-piece-grid">
        {LINKS.map((link) => (
          <article key={link.href} className="admin-piece">
            <h2 className="font-display text-2xl">{link.title}</h2>
            <p className="mt-2 text-sm text-muted">{link.body}</p>
            <div className="admin-piece-actions">
              <Link className="btn btn-plum" href={link.href}>
                Open
              </Link>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
