import { CheckoutForm } from "@/components/shop/CheckoutForm";
import { publishedDonations, publishedOrganization } from "@/lib/cms/public-content";
import { shop } from "@/lib/data/shop";
import { pageMetadata } from "@/lib/seo";
import { isWhatsAppOrderingEnabled } from "@/lib/shop/whatsapp";

export const dynamic = "force-dynamic";

export const metadata = pageMetadata({
  title: "Checkout",
  description: "Place an order from the Kawangware workshop and pay through official channels.",
  path: `${shop.path}/checkout`,
});

export default async function CheckoutPage() {
  const [donations, organization] = await Promise.all([publishedDonations(), publishedOrganization()]);
  const whatsappEnabled = isWhatsAppOrderingEnabled(organization.whatsapp);
  return (
    <div className="shop-checkout-page">
      <p className="eyebrow text-accent">The workshop</p>
      <h1 className="display-md">Your order</h1>
      <p className="shop-checkout-page__lede">
        Review the pieces, then send them to the workshop. Prices are in Kenyan shillings. After the
        order is saved, pay through the official details using your reference
        {whatsappEnabled ? ", or send the same order on WhatsApp" : ""}.
      </p>
      <CheckoutForm methods={donations.methods} whatsappEnabled={whatsappEnabled} />
    </div>
  );
}
