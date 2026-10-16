"use client";

import { ChangeEvent, useEffect, useState } from "react";
import { adminFetch } from "@/components/admin/adminFetch";
import { initials, LEADERSHIP_LIMITS, type LeadershipMember } from "@/lib/cms/leadership";

const PORTRAIT_MAX_PX = 900;

/**
 * Portraits are served as uploaded (the image resizer only reads static files), so shrink them here:
 * at most 900px on the long side, WebP. Falls back to the original file if the browser cannot.
 */
async function shrinkPortrait(file: File): Promise<File> {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, PORTRAIT_MAX_PX / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", 0.85));
    if (!blob || blob.size >= file.size) return file;
    return new File([blob], `${file.name.replace(/\.[^.]+$/, "") || "portrait"}.webp`, { type: "image/webp" });
  } catch {
    return file;
  }
}

function blankMember(): LeadershipMember {
  return { id: `m-${crypto.randomUUID()}`, name: "", title: "", bio: "", photo: "", photoAlt: "" };
}

/** Leadership team on Why We Exist: photo, name, title and what each person does. */
export function LeadershipEditor() {
  const [members, setMembers] = useState<LeadershipMember[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    adminFetch("/api/v1/admin/leadership")
      .then((data) => setMembers((data.members as LeadershipMember[]) ?? []))
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoaded(true));
  }, []);

  function patch(id: string, change: Partial<LeadershipMember>) {
    setMembers((current) => current.map((member) => (member.id === id ? { ...member, ...change } : member)));
    setMessage("");
  }

  function move(index: number, by: -1 | 1) {
    setMembers((current) => {
      const next = [...current];
      const target = index + by;
      if (target < 0 || target >= next.length) return current;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
    setMessage("");
  }

  function remove(member: LeadershipMember) {
    if (!confirm(`Remove ${member.name || "this member"} from the leadership team?`)) return;
    setMembers((current) => current.filter((item) => item.id !== member.id));
    setMessage("");
  }

  async function uploadPhoto(member: LeadershipMember, event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const file = input.files?.[0];
    if (!file) return;
    setError("");
    setUploadingId(member.id);
    try {
      const form = new FormData();
      form.append("file", await shrinkPortrait(file));
      form.append("name", member.name);
      const data = await adminFetch("/api/v1/admin/leadership", { method: "POST", body: form });
      patch(member.id, { photo: String(data.url ?? ""), photoAlt: member.photoAlt || (member.name ? `Portrait of ${member.name}` : "") });
      setMessage("Photo uploaded. Save the team to publish it.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not upload the photo.");
    } finally {
      input.value = "";
      setUploadingId(null);
    }
  }

  async function save() {
    setError("");
    setMessage("");
    const unnamed = members.filter((member) => !member.name.trim()).length;
    setSaving(true);
    try {
      const data = await adminFetch("/api/v1/admin/leadership", {
        method: "PUT",
        body: JSON.stringify({ members }),
      });
      setMembers((data.members as LeadershipMember[]) ?? []);
      setMessage(
        unnamed
          ? `Saved. ${unnamed} card${unnamed === 1 ? "" : "s"} without a name ${unnamed === 1 ? "was" : "were"} left out.`
          : "Saved. The team now shows on Why We Exist.",
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the team.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="admin-stack" aria-labelledby="leadership-editor">
      <div className="admin-form">
        <h2 id="leadership-editor" className="admin-form-title font-display">
          Leadership team
        </h2>
        <p className="admin-help">
          Each person appears on Why We Exist with their photo, title and what they do, in this order. Use a
          clear head-and-shoulders photo (JPEG, PNG or WebP, up to 8MB). Only publish someone with their
          permission.
        </p>
        {error ? <p className="admin-flash admin-flash--error">{error}</p> : null}
        {message ? <p className="admin-flash admin-flash--ok">{message}</p> : null}
        {!loaded ? <p className="admin-loading">Loading the team…</p> : null}

        {loaded && members.length === 0 ? (
          <p className="admin-empty">No one is listed yet. Add the first member below.</p>
        ) : null}

        <ol className="leader-edit-list">
          {members.map((member, index) => (
            <li key={member.id} className="leader-edit">
              <label className="leader-edit__photo" aria-label={`Photo for ${member.name || "this member"}`}>
                {member.photo ? (
                  // eslint-disable-next-line @next/next/no-img-element -- admin preview of an upload that may not be optimised yet
                  <img src={member.photo} alt={member.photoAlt || ""} />
                ) : (
                  <span className="leader-edit__monogram" aria-hidden="true">
                    {initials(member.name) || "+"}
                  </span>
                )}
                <span className="leader-edit__photo-cta">
                  {uploadingId === member.id ? "Uploading…" : member.photo ? "Change photo" : "Add photo"}
                </span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/avif"
                  className="sr-only"
                  disabled={uploadingId !== null}
                  onChange={(event) => uploadPhoto(member, event)}
                />
              </label>

              <div className="leader-edit__fields">
                <div className="leader-edit__row">
                  <label>
                    Name
                    <input
                      value={member.name}
                      maxLength={LEADERSHIP_LIMITS.name}
                      placeholder="e.g. Christopher Erick Otieno"
                      onChange={(event) => patch(member.id, { name: event.target.value })}
                    />
                  </label>
                  <label>
                    Title
                    <input
                      value={member.title}
                      maxLength={LEADERSHIP_LIMITS.title}
                      placeholder="e.g. Chairperson"
                      onChange={(event) => patch(member.id, { title: event.target.value })}
                    />
                  </label>
                </div>
                <label>
                  What they do
                  <textarea
                    rows={4}
                    value={member.bio}
                    maxLength={LEADERSHIP_LIMITS.bio}
                    placeholder="A few sentences on their role and what they bring to the girls and the community."
                    onChange={(event) => patch(member.id, { bio: event.target.value })}
                  />
                  <span className="admin-help">
                    {member.bio.length}/{LEADERSHIP_LIMITS.bio}
                  </span>
                </label>
                {member.photo ? (
                  <label>
                    Photo description (for screen readers)
                    <input
                      value={member.photoAlt}
                      maxLength={LEADERSHIP_LIMITS.photoAlt}
                      onChange={(event) => patch(member.id, { photoAlt: event.target.value })}
                    />
                  </label>
                ) : null}
                <div className="admin-piece-actions">
                  <button type="button" className="btn btn-ghost" onClick={() => move(index, -1)} disabled={index === 0}>
                    ↑ Move up
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => move(index, 1)}
                    disabled={index === members.length - 1}
                  >
                    ↓ Move down
                  </button>
                  {member.photo ? (
                    <button type="button" className="btn btn-ghost" onClick={() => patch(member.id, { photo: "", photoAlt: "" })}>
                      Remove photo
                    </button>
                  ) : null}
                  <button type="button" className="btn admin-danger" onClick={() => remove(member)}>
                    Remove
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ol>

        <div className="admin-piece-actions">
          <button
            type="button"
            className="btn btn-ghost"
            disabled={members.length >= LEADERSHIP_LIMITS.members}
            onClick={() => setMembers((current) => [...current, blankMember()])}
          >
            + Add member
          </button>
          <button type="button" className="btn btn-plum" onClick={save} disabled={saving || uploadingId !== null}>
            {saving ? "Saving…" : "Save team"}
          </button>
        </div>
      </div>
    </section>
  );
}
