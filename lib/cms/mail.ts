import { sanitizeHeaderValue } from "../security.ts";

/** Plain-text mail through Resend; first recipient in To, the rest in Bcc. Returns false when not sent. */
export async function sendResend(to: string[], subject: string, text: string) {
  const key = process.env.RESEND_API_KEY;
  if (!key || !to.length) return false;
  const from = process.env.CONTACT_FROM ?? "Nazarene for She <noreply@nazarene-for-she.org>";
  const recipients = to.slice(0, 40);
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [recipients[0]],
        ...(recipients.length > 1 ? { bcc: recipients.slice(1) } : {}),
        subject: sanitizeHeaderValue(subject, 180),
        text,
      }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) {
      console.error("[mail] mail rejected", response.status);
    }
    return response.ok;
  } catch (error) {
    console.error("[mail] mail failed", error);
    return false;
  }
}
