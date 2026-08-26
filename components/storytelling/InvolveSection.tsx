import Link from "next/link";
import { involvementPaths } from "@/lib/data/donation";
import { Reveal } from "@/components/experience/Reveal";

export function InvolveSection() {
  const [primary, ...rest] = involvementPaths;

  return (
    <section className="bg-plum text-ivory">
      <div className="mx-auto max-w-6xl px-5 py-24 sm:px-8 lg:py-32">
        <Reveal>
          <p className="section-kicker text-accent">
            <b>13</b>
            How can I help
          </p>
          <h2 className="display-lg mt-5 max-w-[16ch]">Help remove a barrier between her and her future.</h2>
        </Reveal>
        <div className="involve-board mt-12">
          <Link href={primary.href} className="involve-feature">
            <span className="eyebrow text-accent-soft">Start here</span>
            <h3>{primary.title}</h3>
            <p>{primary.body}</p>
            <span className="involve-feature-cta">{primary.cta} →</span>
          </Link>
          <div className="involve-side-list">
            {rest.map((path) => (
              <Link key={path.id} href={path.href} className="involve-side">
                <h3>{path.title}</h3>
                <p>{path.body}</p>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
