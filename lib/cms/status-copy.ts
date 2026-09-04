import type { ContentStatus } from "@/lib/cms/permissions";

export const STATUS_LABELS: Record<ContentStatus, string> = {
  draft: "Draft",
  pending_review: "Waiting for review",
  approved: "Approved — not live yet",
  published: "Live on the site",
  archived: "Taken off the site",
};

export const STATUS_HINTS: Record<ContentStatus, string> = {
  draft: "Only people signed in to Admin can see this.",
  pending_review: "Submitted for someone with approval rights.",
  approved: "Ready to publish. Visitors still cannot see it.",
  published: "Visitors can see this on the public website.",
  archived: "Removed from the public website. It can be brought back as a draft.",
};

export function statusLabel(status: string) {
  return STATUS_LABELS[status as ContentStatus] ?? status;
}

export function statusHint(status: string) {
  return STATUS_HINTS[status as ContentStatus] ?? "";
}

export type WorkflowStep = {
  to: ContentStatus;
  label: string;
};

export function workflowActions(status: ContentStatus): WorkflowStep[] {
  switch (status) {
    case "draft":
      return [
        { to: "pending_review", label: "Submit for review" },
        { to: "archived", label: "Archive" },
      ];
    case "pending_review":
      return [
        { to: "approved", label: "Approve" },
        { to: "draft", label: "Return to draft" },
        { to: "archived", label: "Archive" },
      ];
    case "approved":
      return [
        { to: "published", label: "Publish on the site" },
        { to: "pending_review", label: "Send back for review" },
        { to: "draft", label: "Return to draft" },
        { to: "archived", label: "Archive" },
      ];
    case "published":
      return [
        { to: "archived", label: "Take off the site" },
        { to: "draft", label: "Unpublish to draft" },
      ];
    case "archived":
      return [{ to: "draft", label: "Restore as draft" }];
    default:
      return [];
  }
}
