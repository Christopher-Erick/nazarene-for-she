import { contactSchema } from "@/lib/validation/contact";
import {
  clientKey,
  isSameOrigin,
  jsonNoStore,
  rateLimit,
  readJsonBody,
  sanitizeHeaderValue,
} from "@/lib/security";
import { sendToInbox } from "@/lib/cms/mail";

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
  const delivered = await sendToInbox({
    subject,
    text: formatMessage(parsed.data),
    replyTo: parsed.data.email,
  });

  if (!delivered) {
    const production = process.env.NODE_ENV === "production";
    console.error("[contact] delivery unavailable — set up Cloudflare Email (EMAIL binding, CONTACT_FROM, CONTACT_INBOX)");
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
