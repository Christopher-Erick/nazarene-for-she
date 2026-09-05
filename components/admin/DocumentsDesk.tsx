"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { adminFetch } from "@/components/admin/adminFetch";

type DeskType = {
  slug: string;
  label: string;
  chain: Array<{ role: string; label: string }>;
};

type DocumentListItem = {
  id: string;
  reference: string;
  type: string;
  typeLabel: string;
  title: string;
  status: string;
  statusLabel: string;
  currentStageLabel: string;
  submitterName: string;
  dueAt: number | null;
  version: number;
  updatedAt: number;
  waitingOnYou: boolean;
  stale: boolean;
  overdue: boolean;
  summary?: string;
  chain: Array<{ role: string; label: string; state: string }>;
};

type DeskPayload = {
  items: DocumentListItem[];
  counts: {
    inbox: number;
    all: number;
    stale: number;
    archived: number;
    byType: Record<string, number>;
  };
  desk: {
    types: DeskType[];
    submitTypes: DeskType[];
    roles: Array<{ role: string; label: string }>;
    isSuperAdmin?: boolean;
    canAssignOfficers?: boolean;
    needsPatron?: boolean;
    user: { id: string; name: string; role: string };
  };
};

type View = "inbox" | "all" | "stale" | "archived";

function when(ms: number) {
  return new Date(ms).toLocaleString("en-KE", { dateStyle: "medium", timeStyle: "short" });
}

export function DocumentsDesk() {
  const router = useRouter();
  const [data, setData] = useState<DeskPayload | null>(null);
  const [view, setView] = useState<View>("all");
  const [type, setType] = useState("");
  const [q, setQ] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async (nextView = view, nextType = type, nextQ = q) => {
    const params = new URLSearchParams({ view: nextView });
    if (nextType) params.set("type", nextType);
    if (nextQ.trim()) params.set("q", nextQ.trim());
    const payload = (await adminFetch(`/api/v1/admin/documents?${params}`)) as DeskPayload;
    setData(payload);
  }, [q, type, view]);

  useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams({ view });
    if (type) params.set("type", type);
    if (q.trim()) params.set("q", q.trim());
    adminFetch(`/api/v1/admin/documents?${params}`)
      .then((payload) => {
        if (!cancelled) setData(payload as DeskPayload);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      });
    return () => {
      cancelled = true;
    };
  }, [view, type, q]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setSubmitting(true);
    setError("");
    try {
      const created = (await adminFetch("/api/v1/admin/documents", {
        method: "POST",
        body: new FormData(form),
      })) as { item?: { id: string; reference?: string } };
      form.reset();
      setMessage(`Filed ${created.item?.reference ?? "the document"}. Opening the preview and summary…`);
      if (created.item?.id) {
        router.push(`/admin/documents/${created.item.id}`);
        return;
      }
      setView("all");
      await load("all", type, q);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not file the document.");
    } finally {
      setSubmitting(false);
    }
  }

  if (error && !data) return <p className="admin-flash admin-flash--error">{error}</p>;
  if (!data) return <p className="admin-loading">Loading the document desk…</p>;

  const counts = data.counts;

  return (
    <div className="admin-stack">
      <AdminHeader kicker="The organisation" title="Documents">
        <p>
          Internal papers only — requisitions, minutes, and proof of payment. Everyone with access can
          open every paper at every stage, read an AI sketch, and add a note. Approvers still have to
          open the file before they can sign. Mail only notifies, it is not the record.
        </p>
      </AdminHeader>
      {error ? <p className="admin-flash admin-flash--error">{error}</p> : null}
      {message ? <p className="admin-flash admin-flash--ok">{message}</p> : null}
      {data.desk.canAssignOfficers && data.desk.needsPatron ? (
        <p className="admin-flash">
          Patron is not assigned yet. Requisitions and proof of payment will stall after the Chair
          until the Patron is named below.
        </p>
      ) : null}

      <div className="admin-metrics admin-metrics--fill">
        <button type="button" className={`admin-metric${view === "inbox" ? " is-active" : ""}`} onClick={() => setView("inbox")}>
          <span className="admin-metric__label">Waiting on me</span>
          <strong className="admin-metric__value">{counts.inbox}</strong>
          <span className="admin-metric__hint">Approve, decline, or ask for a change</span>
        </button>
        <button type="button" className={`admin-metric${view === "all" ? " is-active" : ""}`} onClick={() => setView("all")}>
          <span className="admin-metric__label">On the desk</span>
          <strong className="admin-metric__value">{counts.all}</strong>
          <span className="admin-metric__hint">Every paper, every stage</span>
        </button>
        <button type="button" className={`admin-metric${view === "stale" ? " is-active" : ""}`} onClick={() => setView("stale")}>
          <span className="admin-metric__label">Idle 7 days</span>
          <strong className="admin-metric__value">{counts.stale}</strong>
          <span className="admin-metric__hint">Still sitting with an officer</span>
        </button>
        <button type="button" className={`admin-metric${view === "archived" ? " is-active" : ""}`} onClick={() => setView("archived")}>
          <span className="admin-metric__label">Archived</span>
          <strong className="admin-metric__value">{counts.archived}</strong>
          <span className="admin-metric__hint">Hidden from the active desk</span>
        </button>
      </div>

      <div className="admin-controls">
        <div className="admin-toolbar">
          <label>
            Type
            <select value={type} onChange={(event) => setType(event.target.value)}>
              <option value="">All kinds</option>
              {data.desk.types.map((item) => (
                <option key={item.slug} value={item.slug}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Find
            <input
              value={q}
              onChange={(event) => setQ(event.target.value)}
              placeholder="Title, reference, or name"
            />
          </label>
        </div>
        {data.desk.roles.length ? (
          <p>
            You hold: {data.desk.roles.map((role) => role.label).join(", ")}. You can still open every
            paper on this desk.
          </p>
        ) : (
          <p>You can open every paper on this desk. You have not been named to an office yet.</p>
        )}
      </div>

      {data.items.length ? (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Paper</th>
                <th>Summary</th>
                <th>Status</th>
                <th>Chain</th>
                <th>Filed by</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((item) => (
                <tr key={item.id}>
                  <td>
                    <Link href={`/admin/documents/${item.id}`}>{item.title}</Link>
                    <p className="admin-help">
                      {item.reference} · {item.typeLabel}
                      {item.overdue ? " · overdue" : ""}
                      {item.stale ? " · idle" : ""}
                    </p>
                  </td>
                  <td>
                    {item.summary ? (
                      <p className="doc-summary">{item.summary}</p>
                    ) : (
                      <p className="admin-help">Open the paper to read the summary beside the preview.</p>
                    )}
                  </td>
                  <td>
                    <span className={`admin-status ${item.status === "approved" ? "is-live" : item.status === "pending" ? "is-review" : item.status === "changes_requested" ? "is-ready" : "is-off"}`}>
                      {item.waitingOnYou ? "Waiting on you" : item.statusLabel}
                    </span>
                    {item.currentStageLabel && item.status === "pending" ? (
                      <p className="admin-help">{item.currentStageLabel}</p>
                    ) : null}
                  </td>
                  <td>
                    <ol className="doc-chain doc-chain--compact">
                      {item.chain.map((stage) => (
                        <li key={stage.role} className={`is-${stage.state}`}>
                          {stage.label}
                        </li>
                      ))}
                    </ol>
                  </td>
                  <td>
                    {item.submitterName}
                    <p className="admin-help">{when(item.updatedAt)}</p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="admin-empty">
          {view === "inbox"
            ? "Nothing is waiting on you."
            : "No documents match this view."}
        </p>
      )}

      {data.desk.submitTypes.length ? (
        <form className="admin-form admin-form-wide" onSubmit={submit}>
          <h2 className="admin-form-title font-display">File a document</h2>
          <p className="admin-help admin-span-2">
            The file is stored privately. Approvals and notes stay here. Mail tells people something
            moved and includes the AI sketch when one is ready — it is not the paper trail.
          </p>
          <label>
            Kind
            <select name="type" required>
              {data.desk.submitTypes.map((item) => (
                <option key={item.slug} value={item.slug}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Due (optional)
            <input name="dueAt" type="date" />
          </label>
          <label className="admin-span-2">
            Title
            <input name="title" required minLength={3} placeholder="What is this paper?" />
          </label>
          <label className="admin-span-2">
            File
            <input name="file" type="file" required accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx,.xls,.xlsx,.csv,application/pdf,image/jpeg,image/png" />
          </label>
          <button className="btn btn-plum" type="submit" disabled={submitting}>
            {submitting ? "Filing…" : "File document"}
          </button>
        </form>
      ) : null}

      {data.desk.canAssignOfficers ? <OfficerPanel /> : null}
    </div>
  );
}

function OfficerPanel() {
  const [officers, setOfficers] = useState<Array<{ role: string; label: string; userId: string | null }>>([]);
  const [people, setPeople] = useState<Array<{ id: string; name: string; roleName?: string; role_name?: string }>>([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    adminFetch("/api/v1/admin/documents/officers")
      .then((payload) => {
        setOfficers((payload.officers as typeof officers) ?? []);
        setPeople((payload.people as typeof people) ?? []);
        setReady(true);
      })
      .catch((err: Error) => setError(err.message));
  }, []);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const next: Record<string, string | null> = {};
    for (const officer of officers) {
      const value = String(form.get(officer.role) ?? "");
      next[officer.role] = value || null;
    }
    try {
      await adminFetch("/api/v1/admin/documents/officers", {
        method: "PUT",
        body: JSON.stringify({ officers: next }),
      });
      setMessage("Offices saved. A website role is not enough — only these named people sit on the chain.");
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save officers.");
    }
  }

  return (
    <form className="admin-form admin-form-wide" onSubmit={save}>
      <h2 className="admin-form-title font-display">Who holds each office</h2>
      <p className="admin-help admin-span-2">
        You name every office. Being Chair or Secretary on the website does not put someone on this
        chain. Grant the document pages in Roles & access, then name the people here.
      </p>
      {error ? <p className="admin-flash admin-flash--error admin-span-2">{error}</p> : null}
      {message ? <p className="admin-flash admin-flash--ok admin-span-2">{message}</p> : null}
      {!ready ? <p className="admin-help admin-span-2">Loading the roster…</p> : null}
      {ready
        ? officers.map((officer) => (
            <label key={officer.role}>
              {officer.label}
              <select name={officer.role} defaultValue={officer.userId ?? ""}>
                <option value="">Not assigned</option>
                {people.map((person) => (
                  <option key={person.id} value={person.id}>
                    {person.name}
                  </option>
                ))}
              </select>
            </label>
          ))
        : null}
      <button className="btn btn-ghost" type="submit">
        Save officers
      </button>
    </form>
  );
}
