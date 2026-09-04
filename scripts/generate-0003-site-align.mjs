import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const now = 1756800000000;

function sql(value) {
  return String(value).replace(/'/g, "''");
}

const shop = readFileSync(join(root, "lib/data/shop.ts"), "utf8");
const start = shop.indexOf("export const garments");
const end = shop.indexOf("export const garmentSlugs");
if (start < 0 || end < 0) throw new Error("Could not find garments in lib/data/shop.ts");
const body = shop.slice(start, end).replace(/export const garments: Garment\[\] = /, "return ");
const garments = new Function(body)();

const pages = [
  {
    slug: "about",
    title: "She is not a problem to be solved.",
    excerpt:
      "She is a person with potential who deserves opportunity. This page is for visitors who want the deeper organisational picture. The story itself lives on the journey through our work.",
    content: "",
  },
  {
    slug: "get-involved",
    title: "There are many ways to walk with her. Pick the one that is yours.",
    excerpt:
      "Help remove a barrier between her and her future. Whether you give, teach, pray or partner, you are participating in a transformation system — not a one-time rescue.",
    content: "",
  },
  {
    slug: "partnership",
    title: "You are not simply funding a program.",
    excerpt: "You are helping build pathways to dignity, skills and independence.",
    content: "",
  },
  {
    slug: "terms",
    title: "Use this site to understand the work — and to walk with it honestly.",
    excerpt: "These terms cover the public website and its forms.",
    content:
      "<h2>Content</h2><p>Unpublished payment details and placeholder stories are marked as such. Do not treat placeholders as official organisational commitments. Mission and vision on this site follow the January 2021 constitution.</p><h2>Giving</h2><p>Donations should be made only through official details published by the organisation. If a field still reads as a placeholder, wait for confirmation before sending funds.</p><h2>The Atelier</h2><p>Requests for garments are inquiries, not completed sales. A price, making time and official payment details will be confirmed in a reply before you should send money. Atmosphere photographs show the workshop, not a specific finished piece already for sale.</p><h2>Stories</h2><p>Photographs used as atmosphere are not portraits of named beneficiaries. Published personal stories will appear only with consent.</p>",
  },
];

const lines = [
  "-- Align CMS modules with this public site: drop Projects and News, add The Atelier, seed real site pages.",
  "PRAGMA foreign_keys = ON;",
  "",
  "INSERT OR IGNORE INTO permissions (id, module, action, description) VALUES",
  "  ('atelier.view', 'atelier', 'view', 'view atelier'),",
  "  ('atelier.create', 'atelier', 'create', 'create atelier'),",
  "  ('atelier.edit', 'atelier', 'edit', 'edit atelier'),",
  "  ('atelier.delete', 'atelier', 'delete', 'delete atelier'),",
  "  ('atelier.approve', 'atelier', 'approve', 'approve atelier'),",
  "  ('atelier.publish', 'atelier', 'publish', 'publish atelier');",
  "",
  "-- Copy each role's Programs access onto The Atelier so existing databases keep the same RBAC shape.",
  "INSERT OR IGNORE INTO role_permissions (role_id, permission_id)",
  "SELECT rp.role_id, 'atelier.' || substr(rp.permission_id, 10)",
  "FROM role_permissions rp",
  "WHERE rp.permission_id LIKE 'programs.%';",
  "",
  "DELETE FROM role_permissions WHERE permission_id LIKE 'projects.%' OR permission_id LIKE 'news.%';",
  "DELETE FROM permissions WHERE module IN ('projects', 'news');",
  "",
  `UPDATE content_items SET deleted_at = ${now}, updated_at = ${now}`,
  "WHERE type IN ('projects', 'news') AND deleted_at IS NULL;",
  "",
];

const pageRows = pages.map((page) => {
  const payload = sql(JSON.stringify({ path: `/${page.slug === "about" ? "about" : page.slug}` }));
  return `  ('page-${page.slug}', 'pages', '${sql(page.title)}', '${page.slug}', '${sql(page.excerpt)}', '${sql(page.content)}', '', 'published', '${payload}', '${sql(page.title)}', '${sql(page.excerpt)}', '/${page.slug}', '', '', '', NULL, NULL, ${now}, ${now}, ${now}, NULL)`;
});

lines.push(
  "INSERT OR IGNORE INTO content_items (",
  "  id, type, title, slug, excerpt, content, featured_image, status, payload,",
  "  seo_title, seo_description, canonical_url, og_title, og_description, og_image,",
  "  created_by, updated_by, created_at, updated_at, published_at, deleted_at",
  ") VALUES",
  pageRows.join(",\n") + ";",
  "",
);

const garmentRows = garments.map((garment) => {
  const payload = sql(
    JSON.stringify({
      collection: garment.collection,
      eyebrow: garment.eyebrow,
      verb: garment.verb,
      lure: garment.lure,
      sizing: garment.sizing,
    }),
  );
  return `  ('atelier-${garment.slug}', 'atelier', '${sql(garment.name)}', '${garment.slug}', '${sql(garment.summary)}', '${sql(garment.explanation)}', '', 'published', '${payload}', '${sql(garment.name)}', '${sql(garment.summary)}', '/shop/${garment.slug}', '', '', '', NULL, NULL, ${now}, ${now}, ${now}, NULL)`;
});

lines.push(
  "INSERT OR IGNORE INTO content_items (",
  "  id, type, title, slug, excerpt, content, featured_image, status, payload,",
  "  seo_title, seo_description, canonical_url, og_title, og_description, og_image,",
  "  created_by, updated_by, created_at, updated_at, published_at, deleted_at",
  ") VALUES",
  garmentRows.join(",\n") + ";",
  "",
);

writeFileSync(join(root, "migrations/0003_align_to_site.sql"), `${lines.join("\n")}\n`);
console.log(`Wrote migrations/0003_align_to_site.sql (${pages.length} pages, ${garments.length} garments)`);
