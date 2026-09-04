import { getDb } from "@/lib/cms/db";
import { checkoutSchema } from "@/lib/validation/checkout";
import { placeOrder } from "@/lib/shop/orders";
import { notifyWorkshop } from "@/lib/shop/notify";
import { formatKes } from "@/lib/shop/money";
import { fitLabels } from "@/lib/data/shop";
import { publishedOrganization } from "@/lib/cms/public-content";
import { isWhatsAppOrderingEnabled, whatsappOrderUrl } from "@/lib/shop/whatsapp";
import { ORDER_CHANNEL_LABELS } from "@/lib/shop/types";
import {
  clientKey,
  isSameOrigin,
  jsonNoStore,
  rateLimit,
  readJsonBody,
} from "@/lib/security";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return jsonNoStore(
      { ok: false, message: "This order can only be placed from our website." },
      { status: 403 },
    );
  }

  const limited = rateLimit(`shop-checkout:${clientKey(request)}`, 6);
  if (!limited.ok) {
    return jsonNoStore(
      { ok: false, message: "Please wait a little before placing another order." },
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
            ? "That order is too large."
            : "We could not read that order.",
      },
      { status: body.error === "payload-too-large" ? 413 : 400 },
    );
  }

  const parsed = checkoutSchema.safeParse(body.data);
  if (!parsed.success) {
    return jsonNoStore(
      { ok: false, message: parsed.error.issues[0]?.message ?? "Please check the form and try again." },
      { status: 422 },
    );
  }

  if (parsed.data.website) {
    return jsonNoStore({
      ok: true,
      message: "Thank you. We have received your order.",
      reference: "NFS-HOLD",
    });
  }

  const org = await publishedOrganization();
  if (parsed.data.channel === "whatsapp" && !isWhatsAppOrderingEnabled(org.whatsapp)) {
    return jsonNoStore(
      {
        ok: false,
        message: "WhatsApp ordering is not available just now. Place the order here instead.",
      },
      { status: 503 },
    );
  }

  const db = await getDb();
  if (!db) {
    return jsonNoStore(
      { ok: false, message: "The shop is not taking orders just now. Please try again shortly." },
      { status: 503 },
    );
  }

  try {
    const result = await placeOrder(db, parsed.data);
    if (!result.ok) {
      return jsonNoStore({ ok: false, message: result.message }, { status: 409 });
    }

    const lines = result.order.items.map(
      (item) =>
        `- ${item.name} (${item.sku}) × ${item.quantity} · ${fitLabels[item.fit as keyof typeof fitLabels] ?? item.fit} · ${item.cloth} · ${formatKes(item.lineTotalKes)}`,
    );
    const text = [
      `Order: ${result.order.reference}`,
      `Channel: ${ORDER_CHANNEL_LABELS[result.order.channel]}`,
      `Name: ${result.order.customerName}`,
      `Email: ${result.order.customerEmail}`,
      `Phone: ${result.order.customerPhone || "—"}`,
      `Gift: ${result.order.gift ? "yes" : "no"}`,
      `Total: ${formatKes(result.order.subtotalKes)}`,
      "",
      "Pieces:",
      ...lines,
      "",
      result.order.deliveryNotes ? `Delivery:\n${result.order.deliveryNotes}` : "",
      result.order.notes ? `Notes:\n${result.order.notes}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    const delivered = await notifyWorkshop({
      subject: `Shop order ${result.order.reference}`,
      text,
    });
    if (!delivered) {
      console.error("[shop] order saved but workshop mail is not configured");
    }

    const whatsappUrl =
      result.order.channel === "whatsapp" ? whatsappOrderUrl(result.order, org.whatsapp) : null;

    return jsonNoStore({
      ok: true,
      message:
        result.order.channel === "whatsapp"
          ? "Your order is saved. Send it on WhatsApp so the workshop can confirm it."
          : "Your order is in. Use the reference below when you pay.",
      reference: result.order.reference,
      accessKey: result.order.accessKey,
      subtotalKes: result.order.subtotalKes,
      channel: result.order.channel,
      whatsappUrl,
    });
  } catch (error) {
    console.error("[shop] checkout failed", error);
    return jsonNoStore(
      { ok: false, message: "We could not place that order just now. Please try again." },
      { status: 503 },
    );
  }
}
