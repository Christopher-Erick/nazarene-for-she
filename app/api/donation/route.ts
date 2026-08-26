import { NextResponse } from "next/server";
import { donationInquirySchema } from "@/lib/validation/donation";
import { clientKey, isSameOrigin, rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ ok: false, message: "This form can only be sent from our website." }, { status: 403 });
  }

  const limited = rateLimit(`donation:${clientKey(request)}`);
  if (!limited.ok) {
    return NextResponse.json(
      { ok: false, message: "Please wait a little before sending another note." },
      { status: 429 },
    );
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ ok: false, message: "We could not read that submission." }, { status: 400 });
  }

  const parsed = donationInquirySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, message: parsed.error.issues[0]?.message ?? "Please check the form and try again." },
      { status: 422 },
    );
  }

  if (parsed.data.website) {
    return NextResponse.json({ ok: true, message: "Thank you. We have received your note." });
  }

  const webhook = process.env.CONTACT_WEBHOOK_URL;
  const key = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_INBOX;
  const text = [
    `Name: ${parsed.data.name}`,
    `Email: ${parsed.data.email}`,
    `Category: ${parsed.data.category}`,
    `Method: ${parsed.data.method}`,
    `Amount: ${parsed.data.amount || "—"}`,
    "",
    parsed.data.message || "No additional note.",
  ].join("\n");

  let delivered = false;
  if (webhook) {
    delivered = (await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject: "Donation inquiry", text }),
    })).ok;
  } else if (key && to) {
    delivered = (await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.CONTACT_FROM ?? "Nazarene for She <noreply@nazarene-for-she.org>",
        to: [to],
        subject: `Donation inquiry — ${parsed.data.category}`,
        text,
      }),
    })).ok;
  }

  return NextResponse.json({
    ok: true,
    delivered,
    message: delivered
      ? "Thank you. We have received your note."
      : "Your note was validated. Email delivery is not connected yet on this environment. If payment details are still placeholders, please wait for official numbers before sending funds.",
  });
}
