import { cloudflareEnv } from "@/lib/cms/cloudflare";
import { sanitizeHeaderValue } from "@/lib/security";
import { parseMailbox, type EmailAddress } from "@/lib/cms/mailbox";

/**
 * All site mail goes out through Cloudflare Email Service (the `EMAIL` send_email binding
 * in wrangler.jsonc). No third-party mail provider and no API key.
 *
 * - CONTACT_FROM: sender on a domain onboarded in Cloudflare → Email Service → Email Sending,
 *   e.g. "Nazarene for She <noreply@yourdomain.org>".
 * - CONTACT_INBOX: the organisation inbox that receives contact, donation and shop notes.
 */

type SendEmailBinding = {
  send(message: {
    to: string | string[];
    bcc?: string | string[];
    from: string | EmailAddress;
    replyTo?: string | EmailAddress;
    subject: string;
    text: string;
  }): Promise<{ messageId: string }>;
};

async function mailSetup() {
  const env = (await cloudflareEnv()) as (CloudflareEnv & { EMAIL?: SendEmailBinding }) | null;
  const from = parseMailbox(process.env.CONTACT_FROM ?? "");
  return { binding: env?.EMAIL ?? null, from };
}

/**
 * Send one plain-text email. The first recipient goes in To and the rest in Bcc, so
 * people on a list never see each other's addresses. Returns false when not sent.
 */
export async function sendMail({
  to,
  subject,
  text,
  replyTo,
}: {
  to: string[];
  subject: string;
  text: string;
  replyTo?: string;
}) {
  const recipients = to.map((item) => item.trim()).filter(Boolean).slice(0, 50);
  if (!recipients.length) return false;
  const { binding, from } = await mailSetup();
  if (!binding || !from) {
    console.warn("[mail] Cloudflare Email is not set up (EMAIL binding or CONTACT_FROM missing) — nothing was sent.");
    return false;
  }
  try {
    await binding.send({
      to: recipients[0],
      ...(recipients.length > 1 ? { bcc: recipients.slice(1) } : {}),
      from,
      ...(replyTo && parseMailbox(replyTo) ? { replyTo: parseMailbox(replyTo)! } : {}),
      subject: sanitizeHeaderValue(subject, 180),
      text,
    });
    return true;
  } catch (error) {
    const code = error && typeof error === "object" && "code" in error ? String(error.code) : "";
    console.error("[mail] Cloudflare Email rejected the message", code || error);
    return false;
  }
}

/** Mail the organisation inbox (contact form, donation notes, shop orders). */
export async function sendToInbox({ subject, text, replyTo }: { subject: string; text: string; replyTo?: string }) {
  const inbox = process.env.CONTACT_INBOX?.trim();
  if (!inbox) {
    console.warn("[mail] CONTACT_INBOX is not set — nothing was sent.");
    return false;
  }
  return sendMail({ to: [inbox], subject, text, replyTo });
}
