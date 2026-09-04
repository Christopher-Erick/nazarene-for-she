"use client";

import { adminFetch } from "@/components/admin/adminFetch";
import { statusHint, statusLabel, workflowActions } from "@/lib/cms/status-copy";
import type { ContentStatus } from "@/lib/cms/permissions";

export function WorkflowBar({
  type,
  id,
  status,
  onChanged,
}: {
  type: string;
  id: string;
  status: string;
  onChanged: () => void | Promise<void>;
}) {
  const steps = workflowActions(status as ContentStatus);

  async function move(next: ContentStatus) {
    await adminFetch(`/api/v1/admin/content/${type}/${id}/transition`, {
      method: "POST",
      body: JSON.stringify({ status: next }),
    });
    await onChanged();
  }

  return (
    <div className="admin-workflow">
      <p>
        <strong>{statusLabel(status)}</strong>
        <span className="text-muted"> — {statusHint(status)}</span>
      </p>
      <div className="admin-workflow-actions">
        {steps.map((step) => (
          <button key={step.to} className="btn btn-ghost" type="button" onClick={() => move(step.to).catch(() => undefined)}>
            {step.label}
          </button>
        ))}
      </div>
    </div>
  );
}
