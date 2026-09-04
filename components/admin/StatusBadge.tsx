import { statusLabel } from "@/lib/cms/status-copy";

export function StatusBadge({ status }: { status: string }) {
  const tone =
    status === "published"
      ? "is-live"
      : status === "approved"
        ? "is-ready"
        : status === "pending_review"
          ? "is-review"
          : status === "archived"
            ? "is-off"
            : "is-draft";
  return <span className={`admin-status ${tone}`}>{statusLabel(status)}</span>;
}
