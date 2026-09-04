import Image from "next/image";
import Link from "next/link";
import { publishedStories } from "@/lib/cms/public-content";
import { Reveal } from "@/components/experience/Reveal";
import { ButtonLink } from "@/components/ui/ButtonLink";

export async function StoriesTeaser() {
  const stories = await publishedStories();
  return (
    <section className="bg-background">
      <div className="mx-auto max-w-6xl px-5 py-24 sm:px-8 lg:py-32">
        <Reveal>
          <p className="section-kicker text-primary">
            <b>12</b>
            Her story
          </p>
          <h2 className="display-lg mt-5 max-w-4xl">Stories are published only with consent.</h2>
          <p className="mt-5 max-w-2xl text-muted">
            We will not invent testimonials. Until girls and young women choose to share, these
            frames remain ready.
          </p>
        </Reveal>
        <div className="mt-14 grid gap-8 md:grid-cols-3">
          {stories.map((story, index) => (
            <Reveal key={story.slug} delay={index * 0.08}>
              <article>
                <Link href={`/stories/${story.slug}`} className="group block">
                  <div className="photo-frame relative aspect-[4/5] overflow-hidden">
                    <Image
                      src={story.portrait}
                      alt={story.portraitAlt}
                      fill
                      sizes="(min-width: 768px) 30vw, 100vw"
                      className="object-cover"
                    />
                  </div>
                  <p className="placeholder-chip mt-4">Consent pending</p>
                  <h3 className="mt-3 font-display text-2xl transition-colors group-hover:text-primary">
                    {story.firstName}
                  </h3>
                </Link>
              </article>
            </Reveal>
          ))}
        </div>
        <div className="mt-12">
          <ButtonLink href="/stories" variant="plum">
            Read story frames
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}
