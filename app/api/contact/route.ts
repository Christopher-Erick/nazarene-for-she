import { NextResponse } from "next/server";
import { contactSchema } from "@/lib/validation/contact";
import { clientKey, isSameOrigin, rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ ok: false, message: "This form can only be sent from our website." }, { status: 403 });
  }

  const limited = rateLimit(`contact:${clientKey(request)}`);
  if (!limited.ok) {
    return NextResponse.json(
      { ok: false, message: "Please wait a little before sending another message." },
      { status: 429 },
    );
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ ok: false, message: "We could not read that submission." }, { status: 400 });
  }

  const parsed = contactSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, message: parsed.error.issues[0]?.message ?? "Please check the form and try again." },
      { status: 422 },
    );
  }

  if (parsed.data.website) {
    return NextResponse.json({
      ok: true,
      message: "Thank you. We have received your message.",
    });
  }

  const delivered = await deliver({
    subject: `Nazarene for She — ${parsed.data.intent} from ${parsed.data.name}`,
    text: formatMessage(parsed.data),
  });

  if (!delivered) {
    return NextResponse.json({
      ok: true,
      delivered: false,
      message:
        "Your message was validated. Outgoing email is not connected on this environment yet — add RESEND_API_KEY or CONTACT_WEBHOOK_URL. Please also use the published contact details when they appear on this page.",
    });
  }

  return NextResponse.json({
    ok: true,
    delivered: true,
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
    const response = await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject, text }),
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
    });
    return response.ok;
  }

  return false;
}
