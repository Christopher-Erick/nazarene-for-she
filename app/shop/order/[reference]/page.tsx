import { notFound } from "next/navigation";
import { DonationPaymentPanel } from "@/components/donation/DonationPaymentPanel";
import { getDb } from "@/lib/cms/db";
import { publishedDonations, publishedOrganization } from "@/lib/cms/public-content";
import { getOrderByReference } from "@/lib/shop/orders";
import { formatKes } from "@/lib/shop/money";
import { fitLabels } from "@/lib/data/shop";
import { shop } from "@/lib/data/shop";
import { pageMetadata } from "@/lib/seo";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { ORDER_CHANNEL_LABELS, ORDER_STATUS_LABELS } from "@/lib/shop/types";
import { whatsappOrderUrl } from "@/lib/shop/whatsapp";

export const dynamic = "force-dynamic";

export const metadata = pageMetadata({
  title: "Order received",
  description: "Your workshop order reference and how to pay.",
  path: `${shop.path}/order`,
});

export default async function ShopOrderPage({
  params,
  searchParams,
}: {
  params: Promise<{ reference: string }>;
  searchParams: Promise<{ k?: string }>;
}) {
  const { reference } = await params;
  const { k } = await searchParams;
  const db = await getDb();
  const order = db ? await getOrderByReference(db, reference, k) : null;
  if (!order) notFound();
  const [donations, organization] = await Promise.all([publishedDonations(), publishedOrganization()]);
  const whatsappUrl = order.channel === "whatsapp" ? whatsappOrderUrl(order, organization.whatsapp) : null;
  const viaWhatsApp = order.channel === "whatsapp";

  return (
    <div className="shop-checkout-page">
      <p className="eyebrow text-accent">Order received</p>
      <h1 className="display-md">{order.reference}</h1>
      <p className="shop-checkout-page__lede">
        {ORDER_STATUS_LABELS[order.status]} · {ORDER_CHANNEL_LABELS[order.channel]} order.{" "}
        {viaWhatsApp
          ? "The order is already saved. Send the WhatsApp message if it did not open, then pay using this reference."
          : "Use this reference when you pay so the workshop can match your transfer to this order."}
      </p>

      <div className="shop-order">
        <section className="shop-order__panel">
          <p className="eyebrow">Pieces</p>
          <p className="shop-checkout__total">
            <span>Total</span>
            <strong>{formatKes(order.subtotalKes)}</strong>
          </p>
          <ul className="shop-checkout__lines">
            {order.items.map((item) => (
              <li key={item.id}>
                <div className="shop-checkout__line-top">
                  <p>{item.name}</p>
                </div>
                <p className="shop-checkout__meta">
                  {item.sku} · {item.quantity} × {fitLabels[item.fit as keyof typeof fitLabels] ?? item.fit} ·{" "}
                  {item.cloth} · {formatKes(item.lineTotalKes)}
                </p>
              </li>
            ))}
          </ul>
          <p className="shop-checkout__meta mt-4">
            {order.customerName}
            {order.customerPhone ? ` · ${order.customerPhone}` : ""} · {order.customerEmail}
          </p>
          {order.deliveryNotes ? (
            <p className="shop-checkout__hint">Delivery: {order.deliveryNotes}</p>
          ) : null}
          <div className="shop-order__actions">
            {whatsappUrl ? (
              <a className="btn btn-plum" href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                Send this order on WhatsApp
              </a>
            ) : null}
            <ButtonLink href="/shop" variant="ghost">
              Back to the shop
            </ButtonLink>
          </div>
        </section>
        <div className="shop-order__panel">
          <DonationPaymentPanel
            method={donations.methods[0]?.id ?? "mpesa"}
            methods={donations.methods}
            heading="Pay with this order reference"
            id="order-payment"
          />
        </div>
      </div>
    </div>
  );
}
