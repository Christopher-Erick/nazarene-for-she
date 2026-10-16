const ALLOWED_TAGS = new Set(["p", "br", "strong", "em", "ul", "ol", "li", "a", "h2", "h3", "blockquote", "span"]);
/** Elements whose whole content is dropped, not just the tags. */
const DROP_WITH_CONTENT =
  /<\s*(script|style|iframe|object|embed|template|noscript|textarea|title|xmp|svg|math)\b[\s\S]*?<\s*\/\s*\1\s*>/gi;
/** Links may point to http(s), this site (/path, not //host), an anchor, or an email address. */
const SAFE_HREF = /^(https?:\/\/|\/(?!\/)|#|mailto:)/i;
const TAG = /<\s*(\/?)\s*([a-z][a-z0-9]*)\b([^<>]*)>/gi;
const HREF = /\bhref\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+))/i;

/** Escape text but keep entities that are already written (&amp;, &mdash;, &#8217; …). */
function escapeTextKeepEntities(value: string) {
  return value
    .replace(/&(?!(?:[a-z][a-z0-9]{1,31}|#\d{1,7}|#x[0-9a-f]{1,6});)/gi, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/** Decode what could hide a scheme (java&#115;cript:, spaces, control characters) before checking a link. */
function decodeForCheck(value: string) {
  return value
    .replace(/&#x([0-9a-f]+);?/gi, (_, hex: string) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);?/g, (_, dec: string) => String.fromCodePoint(Number(dec)))
    .replace(/&colon;/gi, ":")
    .replace(/[\u0000- \u007f]+/g, "");
}

/**
 * Allow-list sanitizer for CMS text. Content is read tag by tag: only the tags above survive, with no
 * attributes except a safe href on links; every piece of text is escaped, so a stray "<" or an
 * unfinished tag can never become markup. Comments, scripts, styles and embedded documents vanish.
 */
export function sanitizeHtml(input: string, max = 80_000) {
  const raw = input
    .slice(0, max)
    .replace(DROP_WITH_CONTENT, "")
    .replace(/<!--[\s\S]*?(?:-->|$)/g, "")
    .replace(/<!\[CDATA\[[\s\S]*?(?:\]\]>|$)/gi, "");

  let out = "";
  let last = 0;
  TAG.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = TAG.exec(raw))) {
    out += escapeTextKeepEntities(raw.slice(last, match.index));
    last = TAG.lastIndex;
    const closing = match[1] === "/";
    const name = match[2].toLowerCase();
    if (!ALLOWED_TAGS.has(name)) continue;
    if (name === "br") {
      if (!closing) out += "<br />";
      continue;
    }
    if (closing) {
      out += `</${name}>`;
      continue;
    }
    if (name === "a") {
      const hrefMatch = match[3].match(HREF);
      const href = (hrefMatch?.[1] ?? hrefMatch?.[2] ?? hrefMatch?.[3] ?? "").trim();
      const checked = decodeForCheck(href);
      if (href && SAFE_HREF.test(checked)) {
        const external = /^https?:\/\//i.test(checked);
        out += `<a href="${escapeAttr(href)}"${external ? ' rel="noopener noreferrer" target="_blank"' : ""}>`;
      } else {
        out += "<a>";
      }
      continue;
    }
    out += `<${name}>`;
  }
  // Whatever is left (including an unfinished "<img src=x onerror=…") is plain text.
  out += escapeTextKeepEntities(raw.slice(last));
  return out;
}

export function escapeAttr(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function escapeText(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function isSlug(value: string) {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value) && value.length <= 80;
}

export function stripToPlain(value: string, max = 280) {
  return value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}
