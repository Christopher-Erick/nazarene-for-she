"use client";

import Link from "next/link";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { WorkflowBar } from "@/components/admin/WorkflowBar";
import { useAdminList } from "@/components/admin/useAdminContent";
import { SITE_PAGES } from "@/lib/cms/site-pages";
import { publicPathFor } from "@/lib/cms/admin-paths";

const COPY: Record<string, string> = {
  about: "Opening of Why We Exist. The mission, vision and longer sections are edited under Organization.",
  "get-involved": "Opening, the ways to walk with her, and the Pray / Mentor sections.",
  partnership: "Opening, who partnership is for, and where it can land.",
  terms: "Opening and the terms visitors read on /terms.",
};

export function SitePageBoard() {
  const { items, error, refresh } = useAdminList("pages");

  return (
    <div className="admin-stack">
      <AdminHeader kicker="The public site" title="Site pages">
        <p>
          These four pages exist on the website. You can change the words visitors read. You cannot
          add extra pages here — Home, Programs, Shop, and the rest already have their own places.
        </p>
      </AdminHeader>
      {error ? <p className="admin-flash admin-flash--error">{error}</p> : null}
      <div className="admin-piece-grid">
        {SITE_PAGES.map((meta) => {
          const item = items.find((row) => row.slug === meta.slug);
          return (
            <article key={meta.slug} className="admin-piece">
              <div className="admin-piece-top">
                <p className="eyebrow text-accent">{meta.label}</p>
                {item ? <StatusBadge status={item.status} /> : <span className="admin-status is-draft">Not in Admin yet</span>}
              </div>
              <h3 className="font-display text-2xl">{item?.title || meta.title}</h3>
              <p className="mt-2 text-sm text-muted">{COPY[meta.slug]}</p>
              {item ? <WorkflowBar type="pages" id={item.id} status={item.status} onChanged={refresh} /> : null}
              <div className="admin-piece-actions">
                {item ? (
                  <Link className="btn btn-plum" href={`/admin/pages/${item.id}`}>
                    Edit this page
                  </Link>
                ) : null}
                <Link className="btn btn-ghost" href={publicPathFor("pages", meta.slug)} target="_blank" rel="noreferrer">
                  View on the website
                </Link>
                {meta.slug === "about" ? (
                  <Link className="btn btn-ghost" href="/admin/organization">
                    Organization copy
                  </Link>
                ) : null}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
