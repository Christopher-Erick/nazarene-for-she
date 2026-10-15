import { donationInquirySchema } from "@/lib/validation/donation";
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
  const delivered = await sendToInbox({
    subject,
    text,
    replyTo: parsed.data.email,
  });

  if (!delivered) {
    console.error("[donation] delivery unavailable — set up Cloudflare Email (EMAIL binding, CONTACT_FROM, CONTACT_INBOX)");
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
