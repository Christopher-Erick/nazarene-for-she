import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { TrackView } from "@/components/analytics/TrackView";
import { analyticsEvents } from "@/lib/analytics";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { PlaceholderNote } from "@/components/ui/PlaceholderNote";
import { programs } from "@/lib/data/programs";
import { publishedProgram, publishedStories } from "@/lib/cms/public-content";
import { pageMetadata } from "@/lib/seo";
import { site } from "@/lib/data/site";
import { escapeJsonForScript } from "@/lib/security";

export function generateStaticParams() {
  return programs.map((program) => ({ slug: program.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const program = await publishedProgram(slug);
  if (!program) return {};
  return pageMetadata({
    title: program.name,
    description: program.summary,
    path: `/programs/${program.slug}`,
  });
}

export default async function ProgramPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const program = await publishedProgram(slug);
  if (!program) notFound();
  const stories = await publishedStories();
  const related = stories.filter((story) => program.relatedStorySlugs.includes(story.slug));

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: program.name,
    provider: { "@type": "NGO", name: site.name },
    areaServed: "Kenya",
    description: program.explanation,
  };

  return (
    <>
      <TrackView event={analyticsEvents.programViewed} id={program.slug} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: escapeJsonForScript(jsonLd) }}
      />
      <header className="bleed-hero relative min-h-[52vh] overflow-hidden bg-plum text-ivory">
        <Image
          src={program.visual}
          alt=""
          fill
          loading="eager"
          fetchPriority="high"
          sizes="100vw"
          className="object-cover opacity-50"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-plum via-plum/70 to-plum/30" />
        <div className="relative mx-auto flex min-h-[52vh] max-w-6xl flex-col justify-end px-5 pb-16 pt-28 sm:px-8">
          <p className="eyebrow text-accent">{program.eyebrow}</p>
          <h1 className="display-lg mt-4 max-w-4xl">{program.name}</h1>
          <p className="mt-5 max-w-2xl text-lg text-ivory/80">{program.summary}</p>
        </div>
      </header>
      <div className="mx-auto grid max-w-6xl gap-12 px-5 py-16 sm:px-8 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <h2 className="font-display text-3xl">The work</h2>
          <p className="mt-4 text-lg text-muted">{program.explanation}</p>
          <h2 className="mt-12 font-display text-3xl">Why it matters</h2>
          <p className="mt-4 text-lg text-muted">{program.impact}</p>
        </div>
        <aside className="lg:col-span-4">
          <div className="border border-line bg-surface p-6">
            <p className="eyebrow text-primary">Walk with her</p>
            <p className="mt-4 text-muted">
              A gift toward {program.donationCategory.toLowerCase()} helps this chapter of the journey continue.
            </p>
            <div className="mt-6 flex flex-col gap-3">
              <ButtonLink href={program.cta.href} variant="plum">
                {program.cta.label}
              </ButtonLink>
              {program.secondaryCta ? (
                <ButtonLink href={program.secondaryCta.href} variant="ghost">
                  {program.secondaryCta.label}
                </ButtonLink>
              ) : null}
            </div>
          </div>
        </aside>
      </div>
      <section className="mx-auto max-w-6xl px-5 pb-24 sm:px-8">
        <h2 className="font-display text-3xl">Related stories</h2>
        {related.length === 0 ? (
          <PlaceholderNote>
            Consented stories linked to this programme will appear here.
          </PlaceholderNote>
        ) : (
          <ul className="mt-6 space-y-3">
            {related.map((story) => (
              <li key={story.slug}>
                <Link
                  href={`/stories/${story.slug}`}
                  className="text-lg text-primary underline-offset-4 hover:underline"
                >
                  {story.firstName}
                </Link>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-10 flex flex-wrap gap-3">
          <ButtonLink href="/programs" variant="ghost">
            All programmes
          </ButtonLink>
          <ButtonLink href={program.cta.href} variant="plum">
            {program.cta.label}
          </ButtonLink>
          {program.secondaryCta ? (
            <ButtonLink href={program.secondaryCta.href} variant="ghost">
              {program.secondaryCta.label}
            </ButtonLink>
          ) : null}
        </div>
      </section>
    </>
  );
}
