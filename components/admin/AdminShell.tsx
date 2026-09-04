"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { adminFetch } from "@/components/admin/adminFetch";

export function AdminShell({
  userName,
  roleName,
  nav,
  children,
}: {
  userName: string;
  roleName: string;
  nav: { href: string; label: string; group: string }[];
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const groups = [...new Set(nav.map((item) => item.group))];

  function isCurrent(href: string) {
    if (href === "/admin") return pathname === "/admin";
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  async function logout() {
    await adminFetch("/api/v1/admin/session", { method: "DELETE" });
    window.location.href = "/admin/login";
  }

  return (
    <div className={`admin-shell${open ? " is-open" : ""}`}>
      <aside className="admin-side">
        <div className="admin-brand">
          Nazarene for She
          <span>Administration</span>
        </div>
        <nav className="admin-nav" aria-label="Admin">
          {groups.map((group) => (
            <div key={group} className="admin-nav-group">
              <p className="admin-nav-heading">{group}</p>
              {nav
                .filter((item) => item.group === group)
                .map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={isCurrent(item.href) ? "page" : undefined}
                    onClick={() => setOpen(false)}
                  >
                    {item.label}
                  </Link>
                ))}
            </div>
          ))}
        </nav>
        <button type="button" className="btn btn-ghost" onClick={logout}>
          Sign out
        </button>
      </aside>
      <div className="admin-main">
        <div className="admin-top">
          <button type="button" className="btn btn-ghost admin-menu-btn" onClick={() => setOpen((value) => !value)}>
            Menu
          </button>
          <p className="text-sm text-muted">
            {userName} · {roleName}
          </p>
        </div>
        {children}
      </div>
    </div>
  );
}
