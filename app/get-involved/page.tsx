import Link from "next/link";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { EventsTeaser } from "@/components/events/EventsTeaser";
import { publishedSitePage } from "@/lib/cms/public-content";
import { involvePathsFrom } from "@/lib/cms/shapes";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Get Involved",
  description:
    "Donate, buy a garment from the workshop, mentor, pray, partner or give resources. Walk with Nazarene for She as girls and young women move from dignity to independence.",
  path: "/get-involved",
});

export default async function GetInvolvedPage() {
  const page = await publishedSitePage("get-involved");
  const pathways = involvePathsFrom(page.payload.pathways);
  const feature = pathways[0];
  const prayTitle =
    typeof page.payload.prayTitle === "string" && page.payload.prayTitle
      ? page.payload.prayTitle
      : "Hold this community in prayer.";
  const prayBody =
    typeof page.payload.prayBody === "string" && page.payload.prayBody
      ? page.payload.prayBody
      : "Pray for girls managing menstruation without shame. For mentors with wisdom. For trainers and the work of their hands. For a model that can grow toward self-sufficiency. For the Word and Love of Jesus Christ to be felt as belonging, never as a condition of care.";
  const mentorTitle =
    typeof page.payload.mentorTitle === "string" && page.payload.mentorTitle
      ? page.payload.mentorTitle
      : "Share knowledge without taking over her story.";
  const mentorBody =
    typeof page.payload.mentorBody === "string" && page.payload.mentorBody
      ? page.payload.mentorBody
      : "Mentorship is accompaniment. If you can offer time, skill or a steady presence, start a conversation and we will follow up through official organisational channels.";

  return (
    <>
      <section className="bleed-hero theme-band">
        <div className="mx-auto max-w-6xl px-5 pb-24 pt-28 sm:px-8 lg:pb-32 lg:pt-32">
          <p className="eyebrow text-accent">{page.kicker}</p>
          <h1 className="display-lg mt-5 max-w-4xl">{page.title}</h1>
          <p className="mt-6 max-w-2xl text-lg theme-muted">{page.excerpt}</p>

          <div className="involve-board mt-12">
            <Link href={feature?.href ?? "/donate"} className="involve-feature">
              <span className="eyebrow text-accent-soft">Start here</span>
              <h2>{feature?.title}</h2>
              <p>{feature?.body}</p>
              <span className="involve-feature-cta">{feature?.cta} →</span>
            </Link>
            <div className="involve-side-list">
              {pathways.slice(1).map((path) => {
                const href = path.id === "pray" ? "#pray" : path.id === "mentor" ? "#mentor" : path.href;
                return (
                  <Link key={path.id} href={href} className="involve-side">
                    <h2>{path.title}</h2>
                    <p>{path.body}</p>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <EventsTeaser />

      <section id="pray" className="bg-background">
        <div className="mx-auto max-w-3xl px-5 py-24 sm:px-8">
          <p className="eyebrow text-primary">Pray</p>
          <h2 className="display-md mt-4">{prayTitle}</h2>
          <p className="mt-6 text-lg text-muted">{prayBody}</p>
        </div>
      </section>

      <section id="mentor" className="bg-surface">
        <div className="mx-auto max-w-3xl px-5 py-24 sm:px-8">
          <p className="eyebrow text-primary">Mentor</p>
          <h2 className="display-md mt-4">{mentorTitle}</h2>
          <p className="mt-6 text-lg text-muted">{mentorBody}</p>
          <div className="mt-10">
            <ButtonLink href="/contact?intent=mentorship" variant="plum">
              Offer to mentor
            </ButtonLink>
          </div>
        </div>
      </section>
    </>
  );
}
