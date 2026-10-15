import type { Story } from "@/lib/data/stories";

/** Byline for a story; renders nothing until a writer is recorded in the admin. */
export function StoryByline({
  story,
  className,
}: {
  story: Pick<Story, "authorName" | "authorTitle">;
  className?: string;
}) {
  if (!story.authorName) return null;
  return (
    <p className={className}>
      Written by <span className="font-semibold">{story.authorName}</span>
      {story.authorTitle ? <> — {story.authorTitle}</> : null}
    </p>
  );
}

/** Closing "about the writer" section at the foot of a story. */
export function StoryAuthorSection({ story }: { story: Pick<Story, "authorName" | "authorTitle"> }) {
  if (!story.authorName) return null;
  return (
    <section className="border-t border-line py-10" aria-labelledby="story-author">
      <p className="eyebrow text-accent">Story written by</p>
      <h2 id="story-author" className="mt-3 font-display text-2xl">
        {story.authorName}
      </h2>
      {story.authorTitle ? <p className="mt-1 text-muted">{story.authorTitle}</p> : null}
    </section>
  );
}
