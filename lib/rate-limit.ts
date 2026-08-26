/**
 * Re-export security helpers used by APIs. Prefer `@/lib/security` for new code.
 * Kept so older imports of `@/lib/rate-limit` keep working during the harden pass.
 */
export {
  rateLimit,
  clientKey,
  isSameOrigin,
} from "@/lib/security";
