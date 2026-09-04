"use client";

export async function adminFetch(path: string, init: RequestInit = {}) {
  const csrf = document.cookie
    .split("; ")
    .find((part) => part.startsWith("nfs_csrf="))
    ?.slice("nfs_csrf=".length);
  const headers = new Headers(init.headers);
  if (csrf) headers.set("x-csrf-token", decodeURIComponent(csrf));
  if (init.body && !(init.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  const response = await fetch(path, { ...init, headers, credentials: "same-origin" });
  const data = (await response.json().catch(() => ({}))) as { ok?: boolean; message?: string } & Record<string, unknown>;
  if (!response.ok) {
    throw new Error(data.message || `Request failed (${response.status})`);
  }
  return data;
}

export async function ensureCsrf() {
  await fetch("/api/v1/admin/session", { credentials: "same-origin" });
}
