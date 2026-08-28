import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { PieceCard } from "@/components/shop/PieceCard";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { PlaceholderNote } from "@/components/ui/PlaceholderNote";
import {
  garments,
  garmentsIn,
  getCollection,
  getGarment,
  shop,
  stillFor,
} from "@/lib/data/shop";
import { site } from "@/lib/data/site";
import { escapeJsonForScript } from "@/lib/security";
import { pageMetadata } from "@/lib/seo";

export function generateStaticParams() {
  return garments.map((garment) => ({ slug: garment.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const garment = getGarment(slug);
  if (!garment) return {};
  return pageMetadata({
    title: garment.name,
    description: garment.summary,
    path: `${shop.path}/${garment.slug}`,
  });
}

export default async function GarmentPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const garment = getGarment(slug);
  if (!garment) notFound();
  const collection = getCollection(garment.collection);
  const related = garmentsIn(garment.collection).filter((item) => item.slug !== garment.slug);
  const still = stillFor(garment.slug);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: garment.name,
    description: garment.explanation,
    brand: { "@type": "NGO", name: site.name },
    offers: {
      "@type": "Offer",
      availability: "https://schema.org/PreOrder",
      url: `${site.url}${shop.path}/${garment.slug}`,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: escapeJsonForScript(jsonLd) }}
      />
      <header className="atelier-piece-hero bleed-hero relative min-h-[52vh] overflow-hidden text-ivory">
        <Image
          src={still.src}
          alt={still.alt}
          fill
          loading="eager"
          fetchPriority="high"
          sizes="100vw"
          className="object-cover opacity-45"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-plum via-plum/70 to-plum/25" />
        <div className="relative mx-auto flex min-h-[52vh] max-w-6xl flex-col justify-end px-5 pb-16 pt-28 sm:px-8">
          <span className="placeholder-chip piece-hero-chip">Placeholder</span>
          <p className="eyebrow mt-4 text-accent">
            {collection?.name} · {garment.eyebrow}
          </p>
          <h1 className="display-lg mt-4 max-w-4xl">{garment.name}</h1>
          <p className="mt-5 max-w-2xl text-lg text-ivory/80">{garment.summary}</p>
        </div>
      </header>
      <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8">
        <p className="atelier-lure">{garment.lure}</p>
        <h2 className="font-display mt-8 text-3xl">The piece</h2>
        <p className="mt-4 max-w-3xl text-lg text-muted">{garment.explanation}</p>
        <PlaceholderNote>
          This photograph is a placeholder of the workshop, not a finished {garment.name.toLowerCase()}{" "}
          already sewn for sale.
        </PlaceholderNote>
      </div>
      <section className="mx-auto max-w-6xl px-5 pb-8 sm:px-8">
        <p className="eyebrow text-primary">On this rack</p>
        <div className="piece-grid mt-5">
          <PieceCard garment={garment} index={0} />
          {related.map((item, index) => (
            <PieceCard key={item.slug} garment={item} index={index + 1} />
          ))}
        </div>
      </section>
      <section className="mx-auto max-w-6xl px-5 pb-24 sm:px-8">
        <div className="flex flex-wrap gap-3">
          <ButtonLink href={`${shop.path}#lookbook`} variant="ghost">
            All pieces
          </ButtonLink>
          <ButtonLink href="/donate" variant="plum">
            Prefer to give a gift
          </ButtonLink>
        </div>
      </section>
    </>
  );
}
