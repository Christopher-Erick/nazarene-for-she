import { isSafeWebhookUrl, sanitizeHeaderValue } from "@/lib/security";

export async function notifyWorkshop({ subject, text }: { subject: string; text: string }) {
  const webhook = process.env.CONTACT_WEBHOOK_URL;
  if (webhook) {
    if (!isSafeWebhookUrl(webhook)) {
      console.error("[shop] CONTACT_WEBHOOK_URL rejected by allowlist/SSRF guard");
      return false;
    }
    const response = await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject, text }),
      signal: AbortSignal.timeout(10_000),
    });
    return response.ok;
  }

  const key = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_INBOX;
  if (key && to) {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.CONTACT_FROM ?? "Nazarene for She <noreply@nazarene-for-she.org>",
        to: [to],
        subject: sanitizeHeaderValue(subject),
        text,
      }),
      signal: AbortSignal.timeout(10_000),
    });
    return response.ok;
  }

  return false;
}
