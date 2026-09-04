export function formatKes(amount: number) {
  const value = Number.isFinite(amount) ? Math.max(0, Math.round(amount)) : 0;
  return `KSh ${value.toLocaleString("en-KE")}`;
}

export const LOW_STOCK = 3;

export function stockTone(stock: number): "out" | "low" | "ok" {
  if (stock <= 0) return "out";
  if (stock <= LOW_STOCK) return "low";
  return "ok";
}

export function stockLabel(stock: number) {
  if (stock <= 0) return "Sold out";
  if (stock <= LOW_STOCK) return `${stock} left`;
  return "In stock";
}

export function parseKesInput(value: unknown) {
  const raw = String(value ?? "").replace(/[, ]/g, "");
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.round(n);
}
