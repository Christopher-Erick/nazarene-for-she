import { ShopFloor } from "@/components/shop/ShopFloor";
import { publishedProducts } from "@/lib/cms/public-content";
import { shop } from "@/lib/data/shop";
import { productHref } from "@/lib/shop/catalog";
import { site } from "@/lib/data/site";
import { escapeJsonForScript } from "@/lib/security";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: shop.name,
  description:
    "Buy dresses, skirts, blouses, palazzos, kimonos, uniforms, totes, kitenges and more made in the Nazarene for She workshop in Kawangware.",
  path: shop.path,
});

export default async function ShopPage() {
  const products = await publishedProducts();
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "OfferCatalog",
    name: `${site.name} ${shop.name}`,
    description: shop.intro,
    url: `${site.url}${shop.path}`,
    itemListElement: products.map((product, index) => ({
      "@type": "Offer",
      position: index + 1,
      priceCurrency: "KES",
      price: product.priceKes,
      availability:
        product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      url: `${site.url}${productHref(product)}`,
      itemOffered: {
        "@type": "Product",
        name: product.name,
        sku: product.sku,
        description: product.summary,
      },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: escapeJsonForScript(jsonLd) }}
      />
      <ShopFloor showExchange />
    </>
  );
}
