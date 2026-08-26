import { donationInquirySchema } from "@/lib/validation/donation";
import {
  clientKey,
  isSafeWebhookUrl,
  isSameOrigin,
  jsonNoStore,
  rateLimit,
  readJsonBody,
  sanitizeHeaderValue,
} from "@/lib/security";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return jsonNoStore(
      { ok: false, message: "This form can only be sent from our website." },
      { status: 403 },
    );
  }

  const limited = rateLimit(`donation:${clientKey(request)}`);
  if (!limited.ok) {
    return jsonNoStore(
      { ok: false, message: "Please wait a little before sending another note." },
      {
        status: 429,
        headers: { "Retry-After": String(Math.ceil((limited.retryAt - Date.now()) / 1000)) },
      },
    );
  }

  const body = await readJsonBody(request);
  if (!body.ok) {
    return jsonNoStore(
      {
        ok: false,
        message:
          body.error === "payload-too-large"
            ? "That submission is too large."
            : "We could not read that submission.",
      },
      { status: body.error === "payload-too-large" ? 413 : 400 },
    );
  }

  const parsed = donationInquirySchema.safeParse(body.data);
  if (!parsed.success) {
    return jsonNoStore(
      { ok: false, message: parsed.error.issues[0]?.message ?? "Please check the form and try again." },
      { status: 422 },
    );
  }

  if (parsed.data.website) {
    return jsonNoStore({ ok: true, message: "Thank you. We have received your note." });
  }

  const text = [
    `Name: ${parsed.data.name}`,
    `Email: ${parsed.data.email}`,
    `Category: ${parsed.data.category}`,
    `Method: ${parsed.data.method}`,
    `Amount: ${parsed.data.amount || "—"}`,
    "",
    parsed.data.message || "No additional note.",
  ].join("\n");

  const subject = sanitizeHeaderValue(`Donation inquiry — ${parsed.data.category}`);
  const delivered = await deliver({ subject, text });

  if (!delivered) {
    console.error("[donation] delivery unavailable — configure CONTACT_WEBHOOK_URL or RESEND_API_KEY + CONTACT_INBOX");
    const production = process.env.NODE_ENV === "production";
    return jsonNoStore(
      {
        ok: false,
        message: production
          ? "We could not deliver your note right now. Please try again later. Do not send funds until official payment details are published."
          : "Note validated locally, but outgoing mail is not configured in this environment.",
      },
      { status: 503 },
    );
  }

  return jsonNoStore({
    ok: true,
    message: "Thank you. We have received your note.",
  });
}

async function deliver({ subject, text }: { subject: string; text: string }) {
  const webhook = process.env.CONTACT_WEBHOOK_URL;
  if (webhook) {
    if (!isSafeWebhookUrl(webhook)) {
      console.error("[donation] CONTACT_WEBHOOK_URL rejected by allowlist/SSRF guard");
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
        subject,
        text,
      }),
      signal: AbortSignal.timeout(10_000),
    });
    return response.ok;
  }

  return false;
}
