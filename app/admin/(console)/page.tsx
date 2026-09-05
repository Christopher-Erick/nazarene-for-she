"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { adminFetch } from "@/components/admin/adminFetch";
import { AdminHeader } from "@/components/admin/AdminHeader";

type Dashboard = {
  user: { name: string; role: string };
  counts: Record<string, number>;
  activity: Array<{ id: string; action: string; resource_type: string; created_at: number }>;
};

const CARDS: Array<{ key: string; href: string; label: string; hint: string }> = [
  { key: "pages", href: "/admin/pages", label: "Site pages", hint: "About, Get Involved, Partnership, Terms" },
  { key: "programs", href: "/admin/programs", label: "Programs", hint: "How we empower" },
  { key: "stories", href: "/admin/stories", label: "Stories", hint: "Consented voices" },
  { key: "events", href: "/admin/events", label: "Events", hint: "Days in the community" },
  { key: "atelier", href: "/admin/shop", label: "Shop", hint: "Categories, pieces, stock and orders" },
  { key: "documents", href: "/admin/documents", label: "Documents", hint: "Internal papers waiting on you" },
  { key: "media", href: "/admin/media", label: "Photographs", hint: "Workshop and atmosphere" },
  { key: "users", href: "/admin/users", label: "People", hint: "Who can sign in" },
];

const ACTION_LABELS: Record<string, string> = {
  USER_LOGIN: "Signed in",
  USER_LOGOUT: "Signed out",
  USER_CREATED: "Added a person",
  USER_UPDATED: "Updated a person",
  PAGES_UPDATED: "Edited a site page",
  PAGES_CREATED: "Created a site page",
  PROGRAMS_UPDATED: "Edited a programme",
  PROGRAMS_CREATED: "Added a programme",
  STORIES_UPDATED: "Edited a story",
  STORIES_CREATED: "Added a story",
  EVENTS_UPDATED: "Edited an event",
  EVENTS_CREATED: "Added an event",
  SHOP_PRODUCT_CREATED: "Added a shop piece",
  SHOP_PRODUCT_UPDATED: "Edited a shop piece",
  SHOP_STOCK_UPDATED: "Updated shop stock",
  SHOP_ORDER_UPDATED: "Updated a shop order",
  ATELIER_UPDATED: "Edited a shop category",
  ATELIER_CREATED: "Added a shop category",
  SETTINGS_CHANGED: "Changed settings",
  DONATION_UPDATED: "Updated donation details",
  DOCUMENT_SUBMITTED: "Filed a document",
  DOCUMENT_APPROVE: "Approved a document stage",
  DOCUMENT_DECLINE: "Declined a document",
  DOCUMENT_REQUEST_CHANGES: "Asked for document changes",
  DOCUMENT_REPLACED: "Replaced a document file",
  DOCUMENT_OFFICERS_UPDATED: "Updated document officers",
};

export default function AdminDashboardPage() {
  const [data, setData] = useState<Dashboard | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    adminFetch("/api/v1/admin/dashboard")
      .then((payload) => setData(payload as Dashboard))
      .catch((err: Error) => setError(err.message));
  }, []);

  if (error) return <p className="admin-flash admin-flash--error">{error}</p>;
  if (!data) return <p className="admin-loading">Loading today…</p>;

  return (
    <div className="admin-stack">
      <AdminHeader kicker="Today" title={`Hello, ${data.user.name.split(" ")[0] || data.user.name}`}>
        <p>
          You are signed in as {data.user.role}. Counts only include what you are allowed to see.
          Drafts stay off the public website until they are published.
        </p>
      </AdminHeader>
      <div className="admin-metrics admin-metrics--fill">
        {CARDS.filter((card) => data.counts[card.key] != null).map((card) => (
          <Link key={card.key} href={card.href} className="admin-metric">
            <span className="admin-metric__label">{card.label}</span>
            <strong className="admin-metric__value">{data.counts[card.key]}</strong>
            <span className="admin-metric__hint">
              {card.hint}
              {data.counts[`${card.key}Drafts`]
                ? ` · ${data.counts[`${card.key}Drafts`]} waiting to go live`
                : ""}
            </span>
          </Link>
        ))}
      </div>
      {data.activity.length ? (
        <section className="admin-group">
          <div className="admin-section-head">
            <h2 className="font-display">Recent activity</h2>
          </div>
          <ul className="admin-activity">
            {data.activity.map((row) => (
              <li key={row.id}>
                <strong>{ACTION_LABELS[row.action] ?? row.action.replaceAll("_", " ").toLowerCase()}</strong>
                <span className="text-muted"> · {new Date(row.created_at).toLocaleString("en-KE")}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
