import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { TrackView } from "@/components/analytics/TrackView";
import { PlaceholderNote } from "@/components/ui/PlaceholderNote";
import { getStory, stories } from "@/lib/data/stories";
import { analyticsEvents } from "@/lib/analytics";
import { pageMetadata } from "@/lib/seo";
import { site } from "@/lib/data/site";

export function generateStaticParams() {
  return stories.map((story) => ({ slug: story.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const story = getStory(slug);
  if (!story) return {};
  return pageMetadata({
    title: story.firstName,
    description: `A story frame from ${site.name}. Published stories appear only with consent.`,
    path: `/stories/${story.slug}`,
  });
}

export default async function StoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const story = getStory(slug);
  if (!story) notFound();

  const jsonLd =
    story.status === "published"
      ? {
          "@context": "https://schema.org",
          "@type": "Article",
          headline: `${story.firstName} — Her Story`,
          author: { "@type": "Organization", name: site.name },
        }
      : null;

  return (
    <article>
      <TrackView event={analyticsEvents.storyViewed} id={story.slug} />
      {jsonLd ? (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      ) : null}
      <header className="bleed-hero relative min-h-[60vh] overflow-hidden bg-plum text-ivory">
        <Image src={story.portrait} alt={story.portraitAlt} fill priority sizes="100vw" className="object-cover opacity-55" />
        <div className="absolute inset-0 bg-gradient-to-t from-plum via-plum/60 to-transparent" />
        <div className="relative mx-auto flex min-h-[60vh] max-w-4xl flex-col justify-end px-5 pb-16 pt-28 sm:px-8">
          {story.status === "placeholder" ? <p className="placeholder-chip">Placeholder · consent pending</p> : null}
          <h1 className="display-lg mt-4">{story.firstName}</h1>
          <p className="mt-3 text-ivory/75">{story.community}</p>
        </div>
      </header>
      <div className="mx-auto max-w-3xl px-5 py-16 sm:px-8">
        <PlaceholderNote>
          Names, ages and identifying details will never appear without explicit permission.
        </PlaceholderNote>
        <StoryBlock title="The challenge" body={story.challenge} />
        <StoryBlock title="With Nazarene for She" body={story.experience} />
        <StoryBlock title="Transformation" body={story.transformation} />
        <StoryBlock title="What she hopes for" body={story.aspiration} />
      </div>
    </article>
  );
}

function StoryBlock({ title, body }: { title: string; body: string }) {
  return (
    <section className="border-t border-line py-10">
      <h2 className="font-display text-3xl">{title}</h2>
      <p className="mt-4 text-lg text-muted">{body}</p>
    </section>
  );
}
