import { AtelierHero } from "@/components/shop/AtelierHero";
import { AtelierLookbook } from "@/components/shop/AtelierLookbook";
import { garments, shop } from "@/lib/data/shop";
import { site } from "@/lib/data/site";
import { escapeJsonForScript } from "@/lib/security";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: shop.name,
  description:
    "Buy dresses, skirts, blouses, palazzos, kimonos, uniforms, totes, kitenges and more made in the Nazarene for She workshop in Kawangware. Pieces are made to order. Price is confirmed before you pay.",
  path: shop.path,
});

export default function ShopPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "OfferCatalog",
    name: `${site.name} ${shop.name}`,
    description: shop.intro,
    url: `${site.url}${shop.path}`,
    itemListElement: garments.map((garment, index) => ({
      "@type": "Offer",
      position: index + 1,
      availability: "https://schema.org/PreOrder",
      url: `${site.url}${shop.path}/${garment.slug}`,
      itemOffered: {
        "@type": "Product",
        name: garment.name,
        description: garment.summary,
      },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: escapeJsonForScript(jsonLd) }}
      />
      <AtelierHero />
      <AtelierLookbook />
    </>
  );
}
