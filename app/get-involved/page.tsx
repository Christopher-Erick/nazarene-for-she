import Link from "next/link";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { involvementPaths } from "@/lib/data/donation";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Get Involved",
  description:
    "Donate, buy a garment from the workshop, mentor, pray, partner or give resources. Walk with Nazarene for She as girls and young women move from dignity to independence.",
  path: "/get-involved",
});

export default function GetInvolvedPage() {
  return (
    <>
      <section className="bleed-hero theme-band">
        <div className="mx-auto max-w-6xl px-5 pb-24 pt-28 sm:px-8 lg:pb-32 lg:pt-32">
          <p className="eyebrow text-accent">Get involved</p>
          <h1 className="display-lg mt-5 max-w-4xl">
            There are many ways to walk with her. Pick the one that is yours.
          </h1>
          <p className="mt-6 max-w-2xl text-lg theme-muted">
            Help remove a barrier between her and her future. Whether you give, teach, pray or
            partner, you are participating in a transformation system — not a one-time rescue.
          </p>

          <div className="involve-board mt-12">
            <Link href="/donate" className="involve-feature">
              <span className="eyebrow text-accent-soft">Start here</span>
              <h2>{involvementPaths[0].title}</h2>
              <p>{involvementPaths[0].body}</p>
              <span className="involve-feature-cta">{involvementPaths[0].cta} →</span>
            </Link>
            <div className="involve-side-list">
              {involvementPaths.slice(1).map((path) => {
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

      <section id="pray" className="bg-background">
        <div className="mx-auto max-w-3xl px-5 py-24 sm:px-8">
          <p className="eyebrow text-primary">Pray</p>
          <h2 className="display-md mt-4">Hold this community in prayer.</h2>
          <p className="mt-6 text-lg text-muted">
            Pray for girls managing menstruation without shame. For mentors with wisdom. For
            trainers and the work of their hands. For a model that can grow toward
            self-sufficiency. For the Word and Love of Jesus Christ to be felt as belonging,
            never as a condition of care.
          </p>
        </div>
      </section>

      <section id="mentor" className="bg-surface">
        <div className="mx-auto max-w-3xl px-5 py-24 sm:px-8">
          <p className="eyebrow text-primary">Mentor</p>
          <h2 className="display-md mt-4">Share knowledge without taking over her story.</h2>
          <p className="mt-6 text-lg text-muted">
            Mentorship is accompaniment. If you can offer time, skill or a steady presence,
            start a conversation and we will follow up through official organisational
            channels.
          </p>
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
