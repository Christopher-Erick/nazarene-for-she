import { sendToInbox } from "@/lib/cms/mail";

/** Tell the workshop inbox about a new order (Cloudflare Email). Replies go to the customer. */
export async function notifyWorkshop({ subject, text, replyTo }: { subject: string; text: string; replyTo?: string }) {
  return sendToInbox({ subject, text, replyTo });
}
