"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { adminFetch } from "@/components/admin/adminFetch";
import { BrandMark } from "@/components/ui/BrandMark";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { pathCoveredByNav } from "@/lib/cms/nav";
import { ASSIGNABLE_ROLE_SLUGS, ROLE_LABELS } from "@/lib/cms/permissions";

export function AdminShell({
  userName,
  roleName,
  canPreview = false,
  previewRoleName = null,
  nav,
  children,
}: {
  userName: string;
  roleName: string;
  /** Real Super Admin: may preview the desk as another role. */
  canPreview?: boolean;
  /** Set while previewing: the role being viewed. */
  previewRoleName?: string | null;
  nav: { href: string; label: string; group: string }[];
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [openedFor, setOpenedFor] = useState(pathname);
  const open = menuOpen && openedFor === pathname;
  const groups = [...new Set(nav.map((item) => item.group))];
  const pageAllowed = pathCoveredByNav(
    pathname,
    nav.map((item) => item.href),
  );

  function isCurrent(href: string) {
    if (href === "/admin") return pathname === "/admin";
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  function closeMenu() {
    setMenuOpen(false);
  }

  function toggleMenu() {
    if (open) {
      setMenuOpen(false);
      return;
    }
    setOpenedFor(pathname);
    setMenuOpen(true);
  }

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const [previewError, setPreviewError] = useState("");

  async function startPreview(role: string) {
    if (!role) return;
    setPreviewError("");
    try {
      await adminFetch("/api/v1/admin/preview", { method: "POST", body: JSON.stringify({ role }) });
      router.push("/admin");
      router.refresh();
    } catch (err) {
      setPreviewError(err instanceof Error ? err.message : "Could not start the preview.");
    }
  }

  async function exitPreview() {
    setPreviewError("");
    try {
      await adminFetch("/api/v1/admin/preview", { method: "DELETE" });
      router.refresh();
    } catch (err) {
      setPreviewError(err instanceof Error ? err.message : "Could not exit the preview.");
    }
  }

  async function logout() {
    await adminFetch("/api/v1/admin/session", { method: "DELETE" });
    router.replace("/admin/login");
    router.refresh();
  }

  const current =
    nav
      .filter((item) => isCurrent(item.href))
      .sort((a, b) => b.href.length - a.href.length)[0] ?? null;

  return (
    <div className={`admin-shell${open ? " is-open" : ""}`}>
      {open ? (
        <button type="button" className="admin-backdrop" aria-label="Close menu" onClick={closeMenu} />
      ) : null}
      <aside className="admin-side">
        <Link className="admin-brand" href="/admin" onClick={closeMenu}>
          <BrandMark className="admin-brand__mark" />
          <span>
            <strong>Nazarene for She</strong>
            <span>Administration</span>
          </span>
        </Link>
        <nav id="admin-nav" className="admin-nav" aria-label="Admin">
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
                    onClick={closeMenu}
                  >
                    {item.label}
                  </Link>
                ))}
            </div>
          ))}
        </nav>
        <div className="admin-side-foot">
          <Link className="admin-user" href="/admin/account" onClick={closeMenu}>
            <strong>{userName}</strong>
            <span>{roleName}</span>
          </Link>
          <button type="button" className="btn btn-ghost" onClick={logout}>
            Sign out
          </button>
        </div>
      </aside>
      <div className="admin-main">
        <div className="admin-top">
          <button
            type="button"
            className="btn btn-ghost admin-menu-btn"
            aria-expanded={open}
            aria-controls="admin-nav"
            onClick={toggleMenu}
          >
            {open ? "Close" : "Menu"}
          </button>
          <p className="admin-top__place">{current?.label ?? "Desk"}</p>
          <div className="admin-top__links">
            {canPreview && !previewRoleName ? (
              <label className="admin-preview-pick">
                <span className="sr-only">Preview the desk as a role</span>
                <select
                  value=""
                  onChange={(event) => startPreview(event.target.value)}
                  aria-label="Preview the desk as a role"
                >
                  <option value="">Preview as…</option>
                  {ASSIGNABLE_ROLE_SLUGS.map((slug) => (
                    <option key={slug} value={slug}>
                      {ROLE_LABELS[slug]}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
            <ThemeToggle />
            <Link className="btn btn-ghost" href="/" target="_blank" rel="noreferrer">
              View website
            </Link>
            <Link className="btn btn-ghost" href="/admin/account">
              My account
            </Link>
          </div>
        </div>
        {previewRoleName ? (
          <div className="admin-flash admin-preview-banner" role="status">
            <span>
              You are previewing the desk as <strong>{previewRoleName}</strong>. This is what they can see; changes are
              turned off.
            </span>
            <button type="button" className="btn btn-plum" onClick={exitPreview}>
              Exit preview
            </button>
          </div>
        ) : null}
        {previewError ? <p className="admin-flash admin-flash--error">{previewError}</p> : null}
        <div className="admin-content">
          {pageAllowed ? (
            children
          ) : (
            <p className="admin-flash admin-flash--error">
              This page is not on your desk.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
