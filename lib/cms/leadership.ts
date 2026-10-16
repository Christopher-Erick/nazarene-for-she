/** Leadership team shown on Why We Exist: stored as one list in site_settings ("leadership_team"). */

export type LeadershipMember = {
  id: string;
  name: string;
  title: string;
  bio: string;
  /** Uploaded photo (/api/v1/public/media/<id>) or a bundled image under /images/. Empty = monogram. */
  photo: string;
  photoAlt: string;
};

export const LEADERSHIP_SETTING_KEY = "leadership_team";

export const LEADERSHIP_LIMITS = {
  members: 24,
  name: 80,
  title: 80,
  bio: 600,
  photoAlt: 160,
} as const;

const MEDIA_PATH = /^\/api\/v1\/public\/media\/[0-9a-f-]{36}$/i;
const BUNDLED_IMAGE = /^\/images\/[\w/-]+\.(webp|png|jpe?g|avif)$/i;

/** Only our own uploads or bundled images may be used as a portrait. */
export function isSafePhotoPath(value: string) {
  return MEDIA_PATH.test(value) || BUNDLED_IMAGE.test(value);
}

function text(value: unknown, max: number) {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim().slice(0, max) : "";
}

function paragraph(value: unknown, max: number) {
  // Keep line breaks people type into the description, but no runs of blank lines.
  return typeof value === "string"
    ? value
        .replace(/\r\n?/g, "\n")
        .replace(/[ \t]+/g, " ")
        .replace(/\n{3,}/g, "\n\n")
        .trim()
        .slice(0, max)
    : "";
}

/** Cleans whatever was stored or sent into a safe, ordered list. Members without a name are dropped. */
export function normalizeLeadership(input: unknown): LeadershipMember[] {
  if (!Array.isArray(input)) return [];
  const seen = new Set<string>();
  const members: LeadershipMember[] = [];
  for (const raw of input) {
    if (!raw || typeof raw !== "object") continue;
    const item = raw as Record<string, unknown>;
    const name = text(item.name, LEADERSHIP_LIMITS.name);
    if (!name) continue;
    let id = text(item.id, 64).replace(/[^\w-]/g, "");
    if (!id || seen.has(id)) id = `m-${members.length + 1}-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 24)}`;
    seen.add(id);
    const photo = text(item.photo, 200);
    members.push({
      id,
      name,
      title: text(item.title, LEADERSHIP_LIMITS.title),
      bio: paragraph(item.bio, LEADERSHIP_LIMITS.bio),
      photo: isSafePhotoPath(photo) ? photo : "",
      photoAlt: text(item.photoAlt, LEADERSHIP_LIMITS.photoAlt),
    });
    if (members.length >= LEADERSHIP_LIMITS.members) break;
  }
  return members;
}

/** "Christopher Erick Otieno" → "CO": first and last initials for the monogram portrait. */
export function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "";
  const first = parts[0][0] ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1][0] ?? "") : "";
  return `${first}${last}`.toUpperCase();
}
