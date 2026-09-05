"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { adminFetch } from "@/components/admin/adminFetch";

type Capabilities = {
  approve: boolean;
  forceApprove: boolean;
  decline: boolean;
  requestChanges: boolean;
  replace: boolean;
  archive: boolean;
  restore: boolean;
  reopen: boolean;
  comment: boolean;
};

type Detail = {
  item: {
    id: string;
    reference: string;
    typeLabel: string;
    title: string;
    status: string;
    statusLabel: string;
    currentStageLabel: string;
    submitterName: string;
    dueAt: number | null;
    version: number;
    declineNote: string;
    summary: string;
    summaryStatus: string;
    updatedAt: number;
    createdAt: number;
    waitingOnYou: boolean;
    stale: boolean;
    overdue: boolean;
    hasOpenedCurrent: boolean;
    mustOpenToDecide: boolean;
    file: { id: string; name: string; mime: string; size: number } | null;
    chain: Array<{ role: string; label: string; state: string }>;
    capabilities: Capabilities;
  };
  events: Array<{
    id: string;
    action: string;
    label: string;
    actor_name: string;
    note: string;
    stageLabel: string;
    onBehalfLabel: string;
    version: number;
    created_at: number;
  }>;
  comments: Array<{
    id: string;
    author_name: string | null;
    body: string;
    created_at: number;
  }>;
  files: Array<{
    id: string;
    version: number;
    name: string;
    mime: string;
    size: number;
    createdAt: number;
  }>;
};

function when(ms: number) {
  return new Date(ms).toLocaleString("en-KE", { dateStyle: "medium", timeStyle: "short" });
}

function statusClass(status: string) {
  if (status === "approved") return "is-live";
  if (status === "pending") return "is-review";
  if (status === "changes_requested") return "is-ready";
  return "is-off";
}

export function DocumentDetail() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [data, setData] = useState<Detail | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [writingSummary, setWritingSummary] = useState(false);
  const summaryAttempt = useRef("");

  const load = useCallback(async () => {
    const payload = (await adminFetch(`/api/v1/admin/documents/${id}`)) as Detail;
    setData(payload);
  }, [id]);

  useEffect(() => {
    let cancelled = false;
    adminFetch(`/api/v1/admin/documents/${id}`)
      .then((payload) => {
        if (!cancelled) setData(payload as Detail);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    function refresh() {
      void load();
    }
    window.addEventListener("focus", refresh);
    return () => window.removeEventListener("focus", refresh);
  }, [load]);

  useEffect(() => {
    if (!data) return;
    if (data.item.summary.trim()) return;
    const key = `${id}:${data.item.version}`;
    if (summaryAttempt.current === key) return;
    summaryAttempt.current = key;
    let cancelled = false;
    let finished = false;
    setWritingSummary(true);
    adminFetch(`/api/v1/admin/documents/${id}/summary`, { method: "POST" })
      .then(() => {
        if (!cancelled) return load();
      })
      .catch(() => {
        /* The paper stays on the desk even if the sketch cannot be written. */
      })
      .finally(() => {
        finished = true;
        if (!cancelled) setWritingSummary(false);
      });
    return () => {
      cancelled = true;
      if (!finished) summaryAttempt.current = "";
    };
  }, [data, id, load]);

  async function act(action: string, extra: Record<string, string> = {}) {
    if (!data) return;
    if ((action === "decline" || action === "request_changes") && note.trim().length < 8) {
      setError("Write at least eight characters so everyone can see why.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await adminFetch(`/api/v1/admin/documents/${id}/actions`, {
        method: "POST",
        body: JSON.stringify({
          action,
          note,
          expectedUpdatedAt: data.item.updatedAt,
          ...extra,
        }),
      });
      setNote("");
      setMessage("Recorded.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "That action could not be completed.");
    } finally {
      setBusy(false);
    }
  }

  async function replace(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!data) return;
    const form = event.currentTarget;
    const payload = new FormData(form);
    payload.set("expectedUpdatedAt", String(data.item.updatedAt));
    setBusy(true);
    setError("");
    try {
      await adminFetch(`/api/v1/admin/documents/${id}/actions`, { method: "POST", body: payload });
      form.reset();
      setMessage("File replaced. Previous approvals no longer count.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not replace the file.");
    } finally {
      setBusy(false);
    }
  }

  if (error && !data) return <p className="admin-flash admin-flash--error">{error}</p>;
  if (!data) return <p className="admin-loading">Opening the paper…</p>;

  const item = data.item;
  const fileUrl = `/api/v1/admin/documents/${id}/file`;
  const previewable = Boolean(item.file?.mime && (item.file.mime.startsWith("image/") || item.file.mime === "application/pdf"));
  const caps = item.capabilities;
  const locked = item.mustOpenToDecide && !item.hasOpenedCurrent;
  const lastDecline = [...data.events].reverse().find((event) => event.action === "declined");

  return (
    <div className="admin-stack">
      <Link className="admin-back" href="/admin/documents">
        Back to documents
      </Link>
      <AdminHeader kicker={item.reference} title={item.title}>
        <p>
          {item.typeLabel}. Filed by {item.submitterName} on {when(item.createdAt)}. A summary sits
          beside the preview as soon as the paper is filed. Approvers still have to open the file
          before they can sign. The file is not on the public website.
        </p>
      </AdminHeader>
      {error ? <p className="admin-flash admin-flash--error">{error}</p> : null}
      {message ? <p className="admin-flash admin-flash--ok">{message}</p> : null}

      <div className="admin-editor">
        <section className="admin-card doc-preview">
            <div className="admin-piece-top">
              <h2 className="font-display">Read the paper</h2>
              <span className={`admin-status ${statusClass(item.status)}`}>
                {item.waitingOnYou ? "Waiting on you" : item.statusLabel}
              </span>
            </div>
            <p className="admin-help">Version {item.version}. Open it here so you can follow what is being signed.</p>
            {item.currentStageLabel && item.status === "pending" ? (
              <p className="mt-2">Currently with {item.currentStageLabel}.</p>
            ) : null}
            {item.stale ? <p className="admin-help">Idle for at least seven days.</p> : null}
            {item.overdue && item.dueAt ? <p className="admin-help">Due {when(item.dueAt)}.</p> : null}
            {item.status === "declined" || item.declineNote || lastDecline ? (
              <div className="doc-decline">
                <p>
                  <strong>Declined</strong>
                  {lastDecline ? ` by ${lastDecline.actor_name} on ${when(lastDecline.created_at)}` : ""}.
                </p>
                <p>{item.declineNote || lastDecline?.note || "A reason was recorded on the trail below."}</p>
              </div>
            ) : null}

            {item.file ? (
              <div className="doc-file mt-4">
                {previewable && item.file.mime.startsWith("image/") ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={fileUrl} alt="" onLoad={() => { if (!item.hasOpenedCurrent) void load(); }} />
                ) : previewable ? (
                  <iframe title="Document preview" src={fileUrl} className="doc-frame" onLoad={() => { if (!item.hasOpenedCurrent) void load(); }} />
                ) : (
                  <p className="admin-help">
                    {item.file.name} cannot be previewed in the browser. Open or download it to read the
                    paper.
                  </p>
                )}
                <div className="admin-piece-actions">
                  <a
                    className="btn btn-ghost"
                    href={fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => window.setTimeout(() => void load(), 700)}
                  >
                    Open
                  </a>
                  <a
                    className="btn btn-ghost"
                    href={`${fileUrl}?download=1`}
                    onClick={() => window.setTimeout(() => void load(), 700)}
                  >
                    Download
                  </a>
                </div>
              </div>
            ) : (
              <p className="admin-empty">The file is missing from storage. The written trail below still stands.</p>
            )}
          </section>

          <div className="doc-side">
            <aside className="admin-card doc-ai">
              <p className="admin-workflow__label">Summary</p>
              {item.summary ? (
                <p className="doc-ai__body">{item.summary}</p>
              ) : writingSummary || item.summaryStatus === "none" ? (
                <p className="admin-help">Writing a summary of this paper…</p>
              ) : item.summaryStatus === "failed" ? (
                <p className="admin-help">The summary could not be written. The paper is still on the desk — open the preview to read it.</p>
              ) : (
                <p className="admin-help">No readable text was found for a summary. Open the preview to read the paper.</p>
              )}
              <p className="admin-help">
                Members can follow the paper from this summary. Approvers still have to open and read
                the file before they can sign.
              </p>
            </aside>

            <aside className="admin-workflow">
              <p className="admin-workflow__label">Approval chain</p>
          <ol className="doc-chain">
            {item.chain.map((stage) => (
              <li key={stage.role} className={`is-${stage.state}`}>
                <strong>{stage.label}</strong>
                <span>
                  {stage.state === "done"
                    ? "Signed"
                    : stage.state === "current"
                      ? "Waiting"
                      : stage.state === "stopped"
                        ? "Stopped here"
                        : "Next"}
                </span>
              </li>
            ))}
          </ol>
          {(caps.approve || caps.decline || caps.requestChanges || caps.forceApprove) && item.status === "pending" ? (
            <label className="mt-4">
              Note (required to decline or ask for changes)
              <textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="Everyone on the desk will see this reason, your name, the day, and the time." />
            </label>
          ) : null}
          {locked ? (
            <p className="admin-help mt-3">
              Open the paper on the left and read it. Signing stays locked until you have opened this
              version.
            </p>
          ) : null}
          <div className="admin-workflow-actions">
            {caps.approve ? (
              <button className="btn btn-plum" type="button" disabled={busy || locked} onClick={() => act("approve")}>
                Approve this stage
              </button>
            ) : null}
            {caps.requestChanges ? (
              <button className="btn btn-ghost" type="button" disabled={busy || locked} onClick={() => act("request_changes")}>
                Request changes
              </button>
            ) : null}
            {caps.decline ? (
              <button className="btn admin-danger" type="button" disabled={busy || locked} onClick={() => act("decline")}>
                Decline
              </button>
            ) : null}
            {caps.forceApprove ? (
              <button className="btn btn-ghost" type="button" disabled={busy || locked} onClick={() => act("force_approve")}>
                Approve in their place
              </button>
            ) : null}
            {caps.reopen ? (
              <button className="btn btn-ghost" type="button" disabled={busy} onClick={() => act("reopen")}>
                Reopen chain
              </button>
            ) : null}
            {caps.archive ? (
              <button className="btn admin-danger" type="button" disabled={busy} onClick={() => act("archive")}>
                Archive
              </button>
            ) : null}
            {caps.restore ? (
              <button className="btn btn-ghost" type="button" disabled={busy} onClick={() => act("restore")}>
                Restore
              </button>
            ) : null}
          </div>
          {caps.forceApprove ? (
            <p className="admin-help mt-3">
              Approving in their place is recorded against you, in the current officer’s name. It does
              not skip later stages.
            </p>
          ) : null}
            </aside>
          </div>
        </div>

      {caps.replace ? (
        <form className="admin-form" onSubmit={replace}>
          <h2 className="admin-form-title font-display">Replace the file</h2>
          <p className="admin-help">
            A new version is kept. Every previous approval is cleared and the chain starts again. That
            is the record — the old file stays attached below.
          </p>
          <label>
            New file
            <input name="file" type="file" required accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx,.xls,.xlsx,.csv,application/pdf" />
          </label>
          <label>
            Why (optional)
            <input name="note" placeholder="What changed?" />
          </label>
          <button className="btn btn-plum" type="submit" disabled={busy}>
            Replace and restart chain
          </button>
        </form>
      ) : null}

      <section className="admin-group">
        <div className="admin-section-head">
          <h2 className="font-display">Paper trail</h2>
        </div>
        <ul className="admin-activity">
          {data.events.map((event) => (
            <li key={event.id}>
              <strong>{event.label}</strong>
              <span className="text-muted">
                · {event.actor_name}
                {event.onBehalfLabel ? ` for ${event.onBehalfLabel}` : ""}
                {event.stageLabel ? ` · ${event.stageLabel}` : ""}
                · v{event.version} · {when(event.created_at)}
              </span>
              {event.note ? <p className="admin-help">{event.note}</p> : null}
            </li>
          ))}
        </ul>
      </section>

      <section className="admin-group">
        <div className="admin-section-head">
          <h2 className="font-display">Notes</h2>
        </div>
        <p className="admin-help">
          If you disagree, write it here. Every member with access sees the note, who wrote it, the
          day, and the time. A note is not an approval or a decline.
        </p>
        {data.comments.length ? (
          <ul className="admin-activity doc-notes">
            {data.comments.map((comment) => (
              <li key={comment.id}>
                <strong>{comment.author_name ?? "Someone"}</strong>
                <span className="text-muted"> · {when(comment.created_at)}</span>
                <p className="admin-help">{comment.body}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="admin-empty">No notes yet.</p>
        )}
        <form
          className="admin-form"
          onSubmit={async (event) => {
            event.preventDefault();
            const form = event.currentTarget;
            const body = String(new FormData(form).get("body") ?? "");
            setBusy(true);
            setError("");
            try {
              await adminFetch(`/api/v1/admin/documents/${id}/actions`, {
                method: "POST",
                body: JSON.stringify({ action: "comment", note: body }),
              });
              form.reset();
              setMessage("Note recorded. Everyone on the desk can read it.");
              await load();
            } catch (err) {
              setError(err instanceof Error ? err.message : "Could not add a note.");
            } finally {
              setBusy(false);
            }
          }}
        >
          <label>
            Add a note
            <textarea name="body" required minLength={8} placeholder="Say why you disagree, or add context. Your name, the day, and the time are kept with it." />
          </label>
          <button className="btn btn-ghost" type="submit" disabled={busy}>
            Add note
          </button>
        </form>
      </section>

      {data.files.length > 1 ? (
        <section className="admin-group">
          <div className="admin-section-head">
            <h2 className="font-display">Kept versions</h2>
          </div>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Version</th>
                  <th>File</th>
                  <th>When</th>
                </tr>
              </thead>
              <tbody>
                {data.files.map((file) => (
                  <tr key={file.id}>
                    <td>v{file.version}</td>
                    <td>
                      <a href={`/api/v1/admin/documents/${id}/file?version=${file.version}&download=1`}>
                        {file.name}
                      </a>
                    </td>
                    <td>{when(file.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
    </div>
  );
}
