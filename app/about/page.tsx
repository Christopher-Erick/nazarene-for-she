import { PageIntro } from "@/components/ui/PageIntro";
import { PlaceholderNote } from "@/components/ui/PlaceholderNote";
import { aboutContent } from "@/lib/data/about";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Why We Exist",
  description:
    "Nazarene for She is a community-based organisation in Congo, Kawangware, Nairobi. Its mission is to empower young girls through sanitary pads, vocational skills, and economic opportunity.",
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
    aboutContent.leadership,
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
                {"status" in section && section.status === "partial" ? (
                  <PlaceholderNote>Current officers will be confirmed separately from the 2021 constitution.</PlaceholderNote>
                ) : null}
                <p className="mt-4 text-lg text-muted">{section.body}</p>
              </section>
            ))}
          </div>
          <aside className="lg:col-span-5">
            <div className="border border-line bg-surface p-8">
              <h2 className="font-display text-3xl">{aboutContent.mission.title}</h2>
              <p className="mt-2 text-sm text-muted">{aboutContent.mission.source}</p>
              <p className="mt-4 text-muted">{aboutContent.mission.body}</p>
            </div>
            <div className="mt-6 border border-line bg-surface p-8">
              <h2 className="font-display text-3xl">{aboutContent.vision.title}</h2>
              <p className="mt-2 text-sm text-muted">{aboutContent.vision.source}</p>
              <p className="mt-4 text-muted">{aboutContent.vision.body}</p>
            </div>
          </aside>
        </div>

        <section className="mt-24">
          <h2 className="display-md">{aboutContent.objectives.title}</h2>
          <p className="mt-3 text-sm text-muted">{aboutContent.objectives.source}</p>
          <ul className="mt-10 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {aboutContent.objectives.items.map((item) => (
              <li key={item.name} className="border-t border-line pt-5">
                <h3 className="font-display text-2xl text-primary-dark">{item.name}</h3>
                <p className="mt-3 text-muted">{item.body}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-24">
          <h2 className="display-md">{aboutContent.activities.title}</h2>
          <p className="mt-3 text-sm text-muted">{aboutContent.activities.source}</p>
          <ul className="mt-8 grid gap-4 sm:grid-cols-2">
            {aboutContent.activities.items.map((item) => (
              <li key={item} className="border border-line bg-surface px-5 py-4 text-lg">
                {item}
              </li>
            ))}
          </ul>
        </section>

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
