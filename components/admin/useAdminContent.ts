"use client";

import { useCallback, useEffect, useState } from "react";
import { adminFetch } from "@/components/admin/adminFetch";

export type AdminItem = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featuredImage: string;
  status: string;
  payload: Record<string, unknown>;
  seo?: { title?: string; description?: string };
  updatedAt: number;
};

export function useAdminItem(type: string, id: string) {
  const [item, setItem] = useState<AdminItem | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    const data = await adminFetch(`/api/v1/admin/content/${type}/${id}`);
    setItem(data.item as AdminItem);
  }, [type, id]);

  useEffect(() => {
    refresh().catch((err: Error) => setError(err.message));
  }, [refresh]);

  async function save(body: Record<string, unknown>) {
    setBusy(true);
    setError("");
    try {
      const data = await adminFetch(`/api/v1/admin/content/${type}/${id}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      });
      setItem(data.item as AdminItem);
      setMessage("Saved. Publish when you want visitors to see it.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save.");
    } finally {
      setBusy(false);
    }
  }

  return { item, error, message, busy, refresh, save, setError, setMessage };
}

export function useAdminList(type: string) {
  const [items, setItems] = useState<AdminItem[]>([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loaded, setLoaded] = useState(false);

  const refresh = useCallback(async () => {
    const data = await adminFetch(`/api/v1/admin/content/${type}`);
    setItems(((data.items as AdminItem[]) ?? []).map((item) => ({
      ...item,
      payload: item.payload ?? {},
    })));
  }, [type]);

  useEffect(() => {
    refresh()
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoaded(true));
  }, [refresh]);

  async function create(body: Record<string, unknown>) {
    setError("");
    await adminFetch(`/api/v1/admin/content/${type}`, {
      method: "POST",
      body: JSON.stringify(body),
    });
    setMessage("Draft created. It stays off the public site until you publish it.");
    await refresh();
  }

  async function remove(id: string, label: string) {
    if (!confirm(`Remove “${label}” from Admin? Visitors will not see it once it is gone.`)) return;
    await adminFetch(`/api/v1/admin/content/${type}/${id}`, { method: "DELETE" });
    await refresh();
  }

  return { items, error, message, loaded, setError, setMessage, refresh, create, remove };
}
