import { PageIntro } from "@/components/ui/PageIntro";
import { PlaceholderNote } from "@/components/ui/PlaceholderNote";
import { aboutContent } from "@/lib/data/about";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Why We Exist",
  description:
    "Nazarene for She exists so girls and young women in Kenyan informal settlements can meet period poverty with dignity, knowledge, faith, skill and a future they can claim.",
  path: "/about",
});

export default function AboutPage() {
  const sections = [
    aboutContent.whoWeAre,
    aboutContent.ourStory,
    aboutContent.approach,
    aboutContent.faith,
    aboutContent.community,
    aboutContent.sustainability,
  ];

  return (
    <>
      <PageIntro kicker="Why we exist" title="She is not a problem to be solved.">
        <p>
          She is a person with potential who deserves opportunity. This page is for visitors
          who want the deeper organisational picture. The story itself lives on the journey
          through our work.
        </p>
      </PageIntro>

      <div className="mx-auto max-w-6xl px-5 pb-24 sm:px-8">
        <div className="grid gap-16 lg:grid-cols-12">
          <div className="space-y-16 lg:col-span-7">
            {sections.map((section) => (
              <section key={section.title}>
                <h2 className="font-display text-3xl">{section.title}</h2>
                <p className="mt-4 text-lg text-muted">{section.body}</p>
              </section>
            ))}
          </div>
          <aside className="lg:col-span-5">
            <div className="border border-line bg-surface p-8">
              <h2 className="font-display text-3xl">{aboutContent.mission.title}</h2>
              <PlaceholderNote>Official mission wording awaiting approval.</PlaceholderNote>
              <p className="mt-4 text-muted">{aboutContent.mission.body}</p>
            </div>
            <div className="mt-6 border border-line bg-surface p-8">
              <h2 className="font-display text-3xl">{aboutContent.vision.title}</h2>
              <PlaceholderNote>Official vision wording awaiting approval.</PlaceholderNote>
              <p className="mt-4 text-muted">{aboutContent.vision.body}</p>
            </div>
          </aside>
        </div>

        <section className="mt-24">
          <h2 className="display-md">{aboutContent.values.title}</h2>
          <PlaceholderNote>Values language is draft until the organisation confirms it.</PlaceholderNote>
          <ul className="mt-10 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {aboutContent.values.items.map((value) => (
              <li key={value.name} className="border-t border-line pt-5">
                <h3 className="font-display text-2xl text-primary-dark">{value.name}</h3>
                <p className="mt-3 text-muted">{value.body}</p>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}
