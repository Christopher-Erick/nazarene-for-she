export const RESET_TTL_MS = 60 * 60 * 1000;
export const RESET_PATH = "/admin/reset-password";

/**
 * Base URL for the emailed link. The configured site URL wins; otherwise the origin the
 * request arrived on (on Cloudflare the Host is the real route, so it cannot be spoofed
 * into someone else's domain).
 */
export function resetBaseUrl(requestUrl: string, siteUrl = process.env.NEXT_PUBLIC_SITE_URL) {
  if (siteUrl) {
    try {
      return new URL(siteUrl).origin;
    } catch {
      /* fall through to the request origin */
    }
  }
  return new URL(requestUrl).origin;
}

export function resetLink(base: string, token: string) {
  return `${base}${RESET_PATH}?token=${encodeURIComponent(token)}`;
}

export function resetMailText(name: string, link: string) {
  return [
    `Hello ${name || "there"},`,
    "",
    "Someone asked to reset the password for your Nazarene for She admin account.",
    "If it was you, open this link within one hour and choose a new password:",
    "",
    link,
    "",
    "If you did not ask for this, you can ignore this email; your password stays the same.",
    "",
    "— Nazarene for She website",
  ].join("\n");
}
