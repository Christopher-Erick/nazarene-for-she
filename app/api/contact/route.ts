import { contactSchema } from "@/lib/validation/contact";
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

  const limited = rateLimit(`contact:${clientKey(request)}`);
  if (!limited.ok) {
    return jsonNoStore(
      { ok: false, message: "Please wait a little before sending another message." },
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

  const parsed = contactSchema.safeParse(body.data);
  if (!parsed.success) {
    return jsonNoStore(
      { ok: false, message: parsed.error.issues[0]?.message ?? "Please check the form and try again." },
      { status: 422 },
    );
  }

  if (parsed.data.website) {
    return jsonNoStore({
      ok: true,
      message: "Thank you. We have received your message.",
    });
  }

  const subject = sanitizeHeaderValue(
    `Nazarene for She — ${parsed.data.intent} from ${parsed.data.name}`,
  );
  const delivered = await deliver({
    subject,
    text: formatMessage(parsed.data),
  });

  if (!delivered) {
    const production = process.env.NODE_ENV === "production";
    console.error("[contact] delivery unavailable — configure CONTACT_WEBHOOK_URL or RESEND_API_KEY + CONTACT_INBOX");
    return jsonNoStore(
      {
        ok: false,
        message: production
          ? "We could not deliver your message right now. Please try again later or use the published contact details when available."
          : "Message validated locally, but outgoing mail is not configured in this environment.",
      },
      { status: 503 },
    );
  }

  return jsonNoStore({
    ok: true,
    message: "Thank you. We have received your message and will reply through official channels.",
  });
}

function formatMessage(data: {
  name: string;
  email: string;
  phone?: string;
  intent: string;
  organisation?: string;
  message: string;
}) {
  return [
    `Name: ${data.name}`,
    `Email: ${data.email}`,
    `Phone: ${data.phone || "—"}`,
    `Intent: ${data.intent}`,
    `Organisation: ${data.organisation || "—"}`,
    "",
    data.message,
  ].join("\n");
}

async function deliver({ subject, text }: { subject: string; text: string }) {
  const webhook = process.env.CONTACT_WEBHOOK_URL;
  if (webhook) {
    if (!isSafeWebhookUrl(webhook)) {
      console.error("[contact] CONTACT_WEBHOOK_URL rejected by allowlist/SSRF guard");
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
