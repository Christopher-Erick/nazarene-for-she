"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { WorkflowBar } from "@/components/admin/WorkflowBar";
import { useAdminItem } from "@/components/admin/useAdminContent";
import { publicPathFor } from "@/lib/cms/admin-paths";
import { involvePathsFrom, pagePayload } from "@/lib/cms/shapes";
import { SITE_PAGES } from "@/lib/cms/site-pages";

export function SitePageEditor({ id }: { id: string }) {
  const { item, error, message, busy, save, refresh } = useAdminItem("pages", id);
  const [audiencesText, setAudiencesText] = useState<string | null>(null);

  const meta = useMemo(
    () => SITE_PAGES.find((page) => page.slug === item?.slug),
    [item?.slug],
  );

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!item) return;
    const form = new FormData(event.currentTarget);
    const slug = item.slug;
    const payload: Record<string, unknown> = {
      kicker: String(form.get("kicker") ?? ""),
    };
    if (slug === "get-involved") {
      const current = involvePathsFrom(item.payload.pathways);
      payload.pathways = current.map((path, index) => ({
        ...path,
        title: String(form.get(`path_title_${index}`) ?? path.title),
        body: String(form.get(`path_body_${index}`) ?? path.body),
      }));
      payload.prayTitle = form.get("prayTitle");
      payload.prayBody = form.get("prayBody");
      payload.mentorTitle = form.get("mentorTitle");
      payload.mentorBody = form.get("mentorBody");
    }
    if (slug === "partnership") {
      const shaped = pagePayload("partnership", item.payload);
      payload.audiences = (audiencesText ?? shaped.audiences.join("\n"))
        .split("\n")
        .map((row) => row.trim())
        .filter(Boolean);
      payload.categories = shaped.categories.map((category, index) => ({
        name: String(form.get(`cat_name_${index}`) ?? category.name),
        body: String(form.get(`cat_body_${index}`) ?? category.body),
      }));
    }
    await save({
      title: form.get("title"),
      slug,
      excerpt: form.get("excerpt"),
      content: form.get("content") ?? item.content,
      payload,
    });
  }

  if (error) return <p className="admin-flash">{error}</p>;
  if (!item) return <p>Loading this page…</p>;
  const slug = item.slug;
  const kicker = String(item.payload.kicker || meta?.kicker || "");
  const pathways = involvePathsFrom(item.payload.pathways);
  const partnership = pagePayload("partnership", item.payload);

  return (
    <div>
      <p>
        <Link href="/admin/pages">Back to site pages</Link>
      </p>
      <AdminHeader
        kicker={meta?.label ?? "Site page"}
        title={item.title}
        previewHref={publicPathFor("pages", slug)}
      />
      {message ? <p className="admin-flash mt-4">{message}</p> : null}
      <WorkflowBar type="pages" id={item.id} status={item.status} onChanged={refresh} />
      <form className="admin-form admin-form-wide mt-6" onSubmit={onSubmit}>
        <label>
          Small heading
          <input name="kicker" defaultValue={kicker} />
        </label>
        <label>
          Page title
          <input name="title" defaultValue={item.title} required />
        </label>
        <label className="admin-span-2">
          Opening paragraph
          <textarea name="excerpt" rows={3} defaultValue={item.excerpt} />
        </label>

        {slug === "about" ? (
          <p className="admin-note admin-span-2">
            Mission, vision, who we are, and the longer sections of Why We Exist are edited in{" "}
            <Link href="/admin/organization">Organization</Link>. This screen is the opening of the page.
          </p>
        ) : null}

        {slug === "get-involved"
          ? pathways.map((path, index) => (
              <fieldset key={path.id} className="admin-span-2 admin-fieldset">
                <legend>{index === 0 ? "Start-here card" : `Way to walk with her ${index + 1}`}</legend>
                <label>
                  Title
                  <input name={`path_title_${index}`} defaultValue={path.title} />
                </label>
                <label>
                  Description
                  <textarea name={`path_body_${index}`} rows={2} defaultValue={path.body} />
                </label>
              </fieldset>
            ))
          : null}

        {slug === "get-involved" ? (
          <>
            <label className="admin-span-2">
              Pray heading
              <input name="prayTitle" defaultValue={String(item.payload.prayTitle ?? "Hold this community in prayer.")} />
            </label>
            <label className="admin-span-2">
              Pray copy
              <textarea name="prayBody" rows={4} defaultValue={String(item.payload.prayBody ?? "")} />
            </label>
            <label className="admin-span-2">
              Mentor heading
              <input name="mentorTitle" defaultValue={String(item.payload.mentorTitle ?? "Share knowledge without taking over her story.")} />
            </label>
            <label className="admin-span-2">
              Mentor copy
              <textarea name="mentorBody" rows={4} defaultValue={String(item.payload.mentorBody ?? "")} />
            </label>
          </>
        ) : null}

        {slug === "partnership" ? (
          <>
            <label className="admin-span-2">
              Who this page is for (one per line)
              <textarea
                rows={6}
                value={audiencesText ?? partnership.audiences.join("\n")}
                onChange={(event) => setAudiencesText(event.target.value)}
              />
            </label>
            {partnership.categories.map((category, index) => (
              <fieldset key={`${category.name}-${index}`} className="admin-span-2 admin-fieldset">
                <legend>Partnership landing {index + 1}</legend>
                <label>
                  Name
                  <input name={`cat_name_${index}`} defaultValue={category.name} />
                </label>
                <label>
                  Description
                  <textarea name={`cat_body_${index}`} rows={2} defaultValue={category.body} />
                </label>
              </fieldset>
            ))}
          </>
        ) : null}

        {slug === "terms" ? (
          <label className="admin-span-2">
            Terms body
            <textarea name="content" rows={14} defaultValue={item.content} />
          </label>
        ) : (
          <input type="hidden" name="content" value={item.content} />
        )}

        <button className="btn btn-plum" type="submit" disabled={busy}>
          {busy ? "Saving…" : "Save page"}
        </button>
      </form>
    </div>
  );
}
