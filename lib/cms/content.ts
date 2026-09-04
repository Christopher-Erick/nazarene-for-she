import { queryAll, queryFirst, run, newId, nowMs } from "@/lib/cms/db";
import type { ContentStatus, CmsModule } from "@/lib/cms/permissions";
import { CONTENT_STATUSES } from "@/lib/cms/permissions";
import { isSlug, sanitizeHtml, slugify, stripToPlain } from "@/lib/cms/sanitize";
import { assertSitePageSlug, atelierPayload } from "@/lib/cms/site-pages";
import { isReservedShopSlug } from "@/lib/shop/types";
import { eventPayload, pagePayload, programPayload, storyPayload } from "@/lib/cms/shapes";

export const CONTENT_TYPES = ["pages", "programs", "stories", "events", "atelier"] as const;
export type ContentType = (typeof CONTENT_TYPES)[number];

export function isContentType(value: string): value is ContentType {
  return (CONTENT_TYPES as readonly string[]).includes(value);
}

export function moduleForType(type: ContentType): CmsModule {
  return type;
}

export type ContentRow = {
  id: string;
  type: ContentType;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featured_image: string;
  status: ContentStatus;
  payload: string;
  seo_title: string;
  seo_description: string;
  canonical_url: string;
  og_title: string;
  og_description: string;
  og_image: string;
  created_by: string | null;
  updated_by: string | null;
  created_at: number;
  updated_at: number;
  published_at: number | null;
  deleted_at: number | null;
};

const ALLOWED_FIELDS = [
  "title",
  "slug",
  "excerpt",
  "content",
  "featured_image",
  "payload",
  "seo_title",
  "seo_description",
  "canonical_url",
  "og_title",
  "og_description",
  "og_image",
] as const;

export type ContentWrite = {
  title: string;
  slug?: string;
  excerpt?: string;
  content?: string;
  featured_image?: string;
  payload?: Record<string, unknown>;
  seo_title?: string;
  seo_description?: string;
  canonical_url?: string;
  og_title?: string;
  og_description?: string;
  og_image?: string;
};

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

export function parsePayload(raw: string) {
  try {
    return asRecord(JSON.parse(raw));
  } catch {
    return {};
  }
}

export function publicContent(row: ContentRow) {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    slug: row.slug,
    excerpt: row.excerpt,
    content: row.content,
    featuredImage: row.featured_image,
    status: row.status,
    payload: parsePayload(row.payload),
    seo: {
      title: row.seo_title || row.title,
      description: row.seo_description || stripToPlain(row.excerpt || row.content),
      canonicalUrl: row.canonical_url,
      ogTitle: row.og_title || row.seo_title || row.title,
      ogDescription: row.og_description || row.seo_description || stripToPlain(row.excerpt || row.content),
      ogImage: row.og_image || row.featured_image,
    },
    publishedAt: row.published_at,
    updatedAt: row.updated_at,
  };
}

export function adminContent(row: ContentRow) {
  return {
    ...publicContent(row),
    createdBy: row.created_by,
    updatedBy: row.updated_by,
    createdAt: row.created_at,
    deletedAt: row.deleted_at,
  };
}

export function normalizeWrite(input: ContentWrite, fallbackTitle = "untitled") {
  const title = String(input.title ?? "").trim().slice(0, 200);
  if (!title) throw new Error("Title is required.");
  const slug = slugify(input.slug || title || fallbackTitle);
  if (!isSlug(slug)) throw new Error("A valid slug is required.");
  return {
    title,
    slug,
    excerpt: String(input.excerpt ?? "").slice(0, 600),
    content: sanitizeHtml(String(input.content ?? "")),
    featured_image: String(input.featured_image ?? "").slice(0, 500),
    payload: JSON.stringify(asRecord(input.payload)),
    seo_title: String(input.seo_title ?? "").slice(0, 200),
    seo_description: String(input.seo_description ?? "").slice(0, 320),
    canonical_url: String(input.canonical_url ?? "").slice(0, 500),
    og_title: String(input.og_title ?? "").slice(0, 200),
    og_description: String(input.og_description ?? "").slice(0, 320),
    og_image: String(input.og_image ?? "").slice(0, 500),
  };
}

export function prepareContentWrite(
  type: ContentType,
  body: Record<string, unknown>,
  previousSlug?: string,
) {
  const write = normalizeWrite(pickWrite(body));
  const payload = asRecord(JSON.parse(write.payload));
  if (type === "pages") {
    assertSitePageSlug(write.slug, previousSlug);
    write.payload = JSON.stringify(pagePayload(write.slug, payload));
  }
  if (type === "atelier") {
    if (isReservedShopSlug(write.slug)) {
      throw new Error("That shop address is reserved for cart and checkout.");
    }
    write.payload = JSON.stringify(atelierPayload(payload));
  }
  if (type === "programs") {
    write.payload = JSON.stringify(programPayload(payload));
  }
  if (type === "stories") {
    write.payload = JSON.stringify(storyPayload(payload));
  }
  if (type === "events") {
    write.payload = JSON.stringify(eventPayload(payload));
  }
  return write;
}

export function pickWrite(body: Record<string, unknown>): ContentWrite {
  const payload = asRecord(body.payload);
  return {
    title: String(body.title ?? ""),
    slug: body.slug != null ? String(body.slug) : undefined,
    excerpt: body.excerpt != null ? String(body.excerpt) : undefined,
    content: body.content != null ? String(body.content) : undefined,
    featured_image: body.featured_image != null ? String(body.featured_image) : undefined,
    payload,
    seo_title: body.seo_title != null ? String(body.seo_title) : undefined,
    seo_description: body.seo_description != null ? String(body.seo_description) : undefined,
    canonical_url: body.canonical_url != null ? String(body.canonical_url) : undefined,
    og_title: body.og_title != null ? String(body.og_title) : undefined,
    og_description: body.og_description != null ? String(body.og_description) : undefined,
    og_image: body.og_image != null ? String(body.og_image) : undefined,
  };
}

export function isContentStatus(value: string): value is ContentStatus {
  return (CONTENT_STATUSES as readonly string[]).includes(value);
}

export async function listContent(
  db: D1Database,
  type: ContentType,
  opts: { includeDeleted?: boolean; status?: ContentStatus; q?: string; limit?: number; offset?: number } = {},
) {
  const limit = Math.min(Math.max(opts.limit ?? 50, 1), 100);
  const offset = Math.max(opts.offset ?? 0, 0);
  const clauses = ["type = ?"];
  const params: unknown[] = [type];
  if (!opts.includeDeleted) clauses.push("deleted_at IS NULL");
  if (opts.status) {
    clauses.push("status = ?");
    params.push(opts.status);
  }
  if (opts.q) {
    clauses.push("(title LIKE ? OR slug LIKE ?)");
    params.push(`%${opts.q}%`, `%${opts.q}%`);
  }
  const rows = await queryAll<ContentRow>(
    db,
    `SELECT * FROM content_items WHERE ${clauses.join(" AND ")} ORDER BY updated_at DESC LIMIT ? OFFSET ?`,
    ...params,
    limit,
    offset,
  );
  return rows;
}

export async function getContent(db: D1Database, type: ContentType, id: string) {
  return queryFirst<ContentRow>(
    db,
    "SELECT * FROM content_items WHERE type = ? AND id = ? AND deleted_at IS NULL",
    type,
    id,
  );
}

export async function getPublishedBySlug(db: D1Database, type: ContentType, slug: string) {
  return queryFirst<ContentRow>(
    db,
    "SELECT * FROM content_items WHERE type = ? AND slug = ? AND status = 'published' AND deleted_at IS NULL",
    type,
    slug,
  );
}

export async function listPublished(db: D1Database, type: ContentType) {
  return queryAll<ContentRow>(
    db,
    "SELECT * FROM content_items WHERE type = ? AND status = 'published' AND deleted_at IS NULL ORDER BY published_at DESC, updated_at DESC",
    type,
  );
}

export async function slugTaken(db: D1Database, type: ContentType, slug: string, exceptId?: string) {
  const row = exceptId
    ? await queryFirst<{ id: string }>(
        db,
        "SELECT id FROM content_items WHERE type = ? AND slug = ? AND id != ? AND deleted_at IS NULL",
        type,
        slug,
        exceptId,
      )
    : await queryFirst<{ id: string }>(
        db,
        "SELECT id FROM content_items WHERE type = ? AND slug = ? AND deleted_at IS NULL",
        type,
        slug,
      );
  return Boolean(row);
}

export async function insertContent(
  db: D1Database,
  type: ContentType,
  write: ReturnType<typeof normalizeWrite>,
  userId: string,
) {
  const id = newId();
  const now = nowMs();
  await run(
    db,
    `INSERT INTO content_items (
      id, type, title, slug, excerpt, content, featured_image, status, payload,
      seo_title, seo_description, canonical_url, og_title, og_description, og_image,
      created_by, updated_by, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, 'draft', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    id,
    type,
    write.title,
    write.slug,
    write.excerpt,
    write.content,
    write.featured_image,
    write.payload,
    write.seo_title,
    write.seo_description,
    write.canonical_url,
    write.og_title,
    write.og_description,
    write.og_image,
    userId,
    userId,
    now,
    now,
  );
  return getContent(db, type, id);
}

export async function updateContent(
  db: D1Database,
  row: ContentRow,
  write: ReturnType<typeof normalizeWrite>,
  userId: string,
) {
  const now = nowMs();
  await snapshotVersion(db, row, userId);
  await run(
    db,
    `UPDATE content_items SET
      title = ?, slug = ?, excerpt = ?, content = ?, featured_image = ?, payload = ?,
      seo_title = ?, seo_description = ?, canonical_url = ?, og_title = ?, og_description = ?, og_image = ?,
      updated_by = ?, updated_at = ?
     WHERE id = ?`,
    write.title,
    write.slug,
    write.excerpt,
    write.content,
    write.featured_image,
    write.payload,
    write.seo_title,
    write.seo_description,
    write.canonical_url,
    write.og_title,
    write.og_description,
    write.og_image,
    userId,
    now,
    row.id,
  );
  return getContent(db, row.type, row.id);
}

export async function setContentStatus(
  db: D1Database,
  row: ContentRow,
  status: ContentStatus,
  userId: string,
) {
  const now = nowMs();
  await snapshotVersion(db, row, userId);
  const publishedAt = status === "published" ? (row.published_at ?? now) : row.published_at;
  await run(
    db,
    "UPDATE content_items SET status = ?, published_at = ?, updated_by = ?, updated_at = ? WHERE id = ?",
    status,
    publishedAt,
    userId,
    now,
    row.id,
  );
  return getContent(db, row.type, row.id);
}

export async function softDeleteContent(db: D1Database, row: ContentRow, userId: string) {
  await snapshotVersion(db, row, userId);
  await run(
    db,
    "UPDATE content_items SET deleted_at = ?, updated_by = ?, updated_at = ? WHERE id = ?",
    nowMs(),
    userId,
    nowMs(),
    row.id,
  );
}

async function snapshotVersion(db: D1Database, row: ContentRow, userId: string) {
  const latest = await queryFirst<{ n: number }>(
    db,
    "SELECT COALESCE(MAX(version), 0) AS n FROM content_versions WHERE content_id = ?",
    row.id,
  );
  await run(
    db,
    "INSERT INTO content_versions (id, content_id, version, snapshot, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?)",
    newId(),
    row.id,
    (latest?.n ?? 0) + 1,
    JSON.stringify(row),
    userId,
    nowMs(),
  );
}

export async function listVersions(db: D1Database, contentId: string) {
  return queryAll<{ id: string; version: number; created_at: number; created_by: string | null }>(
    db,
    "SELECT id, version, created_at, created_by FROM content_versions WHERE content_id = ? ORDER BY version DESC",
    contentId,
  );
}

export async function restoreVersion(db: D1Database, row: ContentRow, versionId: string, userId: string) {
  const version = await queryFirst<{ snapshot: string }>(
    db,
    "SELECT snapshot FROM content_versions WHERE id = ? AND content_id = ?",
    versionId,
    row.id,
  );
  if (!version) return null;
  const snap = JSON.parse(version.snapshot) as ContentRow;
  await snapshotVersion(db, row, userId);
  await run(
    db,
    `UPDATE content_items SET
      title = ?, slug = ?, excerpt = ?, content = ?, featured_image = ?, payload = ?,
      seo_title = ?, seo_description = ?, canonical_url = ?, og_title = ?, og_description = ?, og_image = ?,
      status = ?, updated_by = ?, updated_at = ?
     WHERE id = ?`,
    snap.title,
    snap.slug,
    snap.excerpt,
    snap.content,
    snap.featured_image,
    snap.payload,
    snap.seo_title,
    snap.seo_description,
    snap.canonical_url,
    snap.og_title,
    snap.og_description,
    snap.og_image,
    snap.status === "published" ? "draft" : snap.status,
    userId,
    nowMs(),
    row.id,
  );
  return getContent(db, row.type, row.id);
}

void ALLOWED_FIELDS;
