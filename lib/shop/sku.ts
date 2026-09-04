const PREFIX = "NFS";

export function skuPrefix(categorySlug: string) {
  const code = categorySlug.replace(/[^a-z0-9]/gi, "").toUpperCase().slice(0, 10);
  return `${PREFIX}-${code || "PIECE"}`;
}

export function formatSku(prefix: string, n: number) {
  return `${prefix}-${String(Math.max(1, Math.floor(n))).padStart(4, "0")}`;
}

export function parseSkuNumber(sku: string, prefix: string) {
  if (!sku.startsWith(`${prefix}-`)) return 0;
  const n = Number(sku.slice(prefix.length + 1));
  return Number.isFinite(n) ? n : 0;
}

export async function nextSku(db: D1Database, categorySlug: string) {
  const prefix = skuPrefix(categorySlug);
  const row = await db
    .prepare(
      `INSERT INTO shop_sku_counters (prefix, next_n) VALUES (?, 1)
       ON CONFLICT(prefix) DO UPDATE SET next_n = next_n + 1
       RETURNING next_n`,
    )
    .bind(prefix)
    .first<{ next_n: number }>();
  const n = row?.next_n ?? 1;
  return formatSku(prefix, n);
}
