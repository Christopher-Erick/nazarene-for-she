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
      <header className="atelier-hero atelier-piece-hero bleed-hero">
        <div className="atelier-hero-layer">
          <Image
            src={still.src}
            alt={still.alt}
            fill
            loading="eager"
            fetchPriority="high"
            sizes="100vw"
            className="object-cover object-[center_42%]"
          />
        </div>
        <div className="atelier-hero-veil" />
        <div className="grain" />
        <svg className="atelier-hero-stitch" viewBox="0 0 1200 80" fill="none" aria-hidden="true">
          <path
            d="M0 44C120 18 220 62 340 36C460 10 560 70 700 32C840 -6 960 58 1200 24"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray="6 10"
          />
        </svg>
        <div className="atelier-hero-copy">
          <span className="placeholder-chip piece-hero-chip">Placeholder</span>
          <p className="eyebrow mt-4 text-accent">
            {collection?.name} · {garment.eyebrow}
          </p>
          <h1 className="display-lg mt-3 max-w-4xl text-ivory">{garment.name}</h1>
          <p className="atelier-hero-cta">{garment.summary}</p>
        </div>
      </header>
      <div className="piece-rack py-16">
        <p className="atelier-lure">{garment.lure}</p>
        <h2 className="font-display mt-8 text-3xl">The piece</h2>
        <p className="mt-4 max-w-3xl text-lg text-muted">{garment.explanation}</p>
        <PlaceholderNote>
          This photograph is a placeholder of the workshop, not a finished {garment.name.toLowerCase()}{" "}
          already sewn for sale.
        </PlaceholderNote>
      </div>
      <section className="piece-rack pb-8">
        <p className="eyebrow text-primary">On this rack</p>
        <div className="piece-grid piece-grid--detail mt-5">
          <PieceCard garment={garment} index={0} />
          {related.map((item, index) => (
            <PieceCard key={item.slug} garment={item} index={index + 1} />
          ))}
        </div>
      </section>
      <section className="piece-rack pb-24">
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
