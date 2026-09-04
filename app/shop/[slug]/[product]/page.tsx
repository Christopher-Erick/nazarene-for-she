import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ShopProductView } from "@/components/shop/ShopProductView";
import { publishedCategory, publishedProduct, publishedProducts } from "@/lib/cms/public-content";
import { productHref, staticProducts } from "@/lib/shop/catalog";
import { pageMetadata } from "@/lib/seo";

export async function generateStaticParams() {
  const live = await publishedProducts();
  const products = live.length ? live : staticProducts();
  return products.map((product) => ({
    slug: product.categorySlug,
    product: product.slug,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; product: string }>;
}): Promise<Metadata> {
  const { slug, product: productSlug } = await params;
  const item = await publishedProduct(slug, productSlug);
  if (!item) return {};
  return pageMetadata({
    title: item.name,
    description: item.summary,
    path: productHref(item),
  });
}

export default async function ShopProductPage({
  params,
}: {
  params: Promise<{ slug: string; product: string }>;
}) {
  const { slug, product: productSlug } = await params;
  const item = await publishedProduct(slug, productSlug);
  if (!item) notFound();
  const category = await publishedCategory(item.categorySlug);
  const related = (await publishedProducts())
    .filter((row) => row.categorySlug === item.categorySlug && row.id !== item.id)
    .slice(0, 3);

  return (
    <ShopProductView
      product={item}
      category={category}
      related={related}
      backHref={`/shop/${item.categorySlug}`}
      backLabel={`Back to ${category?.name ?? "this category"}`}
    />
  );
}
