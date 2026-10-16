import Image from "next/image";
import Link from "next/link";
import { PageIntro } from "@/components/ui/PageIntro";
import { StoryByline } from "@/components/storytelling/StoryByline";
import { publishedStories } from "@/lib/cms/public-content";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Stories of Girls in Kawangware",
  description:
    "Stories of girls and young women in Kawangware, Nairobi, told only with their consent: what they face and how dignity, faith and skills change their path.",
  path: "/stories",
});

export default async function StoriesPage() {
  const stories = await publishedStories();
  return (
    <>
      <PageIntro kicker="Stories" title="Her story, in her time, with her permission.">
        <p>
          We will never fabricate a testimonial. Until consented stories are ready, these
          pages hold the shape of the storytelling system — photograph, name, community,
          challenge, experience, transformation, aspiration.
        </p>
      </PageIntro>
      <div className="mx-auto grid max-w-6xl gap-10 px-5 pb-24 sm:px-8 lg:grid-cols-3">
        {stories.map((story) => (
          <article key={story.slug}>
            <Link href={`/stories/${story.slug}`} className="group block">
              <div className="relative aspect-[4/5] overflow-hidden">
                <Image
                  src={story.portrait}
                  alt={story.portraitAlt}
                  fill
                  sizes="(min-width: 1024px) 30vw, 100vw"
                  className="object-cover transition duration-700 group-hover:scale-105"
                />
              </div>
              <p className="placeholder-chip mt-4">
                {story.status === "placeholder" ? "Placeholder" : "Her story"}
              </p>
              <h2 className="mt-3 font-display text-3xl">{story.firstName}</h2>
              <p className="mt-2 text-muted">{story.community}</p>
              <StoryByline story={story} className="mt-2 text-sm text-muted" />
            </Link>
          </article>
        ))}
      </div>
    </>
  );
}
