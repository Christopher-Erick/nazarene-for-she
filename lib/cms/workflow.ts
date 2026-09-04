import type { ContentStatus, CmsAction } from "./permissions.ts";

const TRANSITIONS: Record<ContentStatus, Partial<Record<ContentStatus, CmsAction>>> = {
  draft: { pending_review: "edit", archived: "edit" },
  pending_review: { approved: "approve", draft: "edit", archived: "edit" },
  approved: { published: "publish", draft: "edit", pending_review: "edit", archived: "edit" },
  published: { archived: "publish", draft: "edit" },
  archived: { draft: "edit" },
};

export function requiredActionForTransition(from: ContentStatus, to: ContentStatus): CmsAction | null {
  if (from === to) return "edit";
  return TRANSITIONS[from]?.[to] ?? null;
}

export function canTransition(from: ContentStatus, to: ContentStatus) {
  return requiredActionForTransition(from, to) !== null;
}
