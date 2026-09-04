import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ShopFloor } from "@/components/shop/ShopFloor";
import { publishedCategories, publishedCategory } from "@/lib/cms/public-content";
import { garments as staticGarments, shop } from "@/lib/data/shop";
import { site } from "@/lib/data/site";
import { escapeJsonForScript } from "@/lib/security";
import { pageMetadata } from "@/lib/seo";
import { isReservedShopSlug } from "@/lib/shop/types";

export async function generateStaticParams() {
  const categories = await publishedCategories();
  const slugs = categories
    .map((category) => category.slug)
    .filter((slug) => !isReservedShopSlug(slug));
  if (slugs.length) return slugs.map((slug) => ({ slug }));
  return staticGarments.map((garment) => ({ slug: garment.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  if (isReservedShopSlug(slug)) return {};
  const category = await publishedCategory(slug);
  if (!category) return {};
  return pageMetadata({
    title: category.name,
    description: category.summary,
    path: `${shop.path}/${category.slug}`,
  });
}

export default async function ShopCategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (isReservedShopSlug(slug)) notFound();
  const category = await publishedCategory(slug);
  if (!category) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: category.name,
    description: category.summary,
    url: `${site.url}${shop.path}/${category.slug}`,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: escapeJsonForScript(jsonLd) }}
      />
      <ShopFloor categorySlug={category.slug} title={category.name} />
    </>
  );
}
