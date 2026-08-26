import { ButtonLink } from "@/components/ui/ButtonLink";
import { Reveal } from "@/components/experience/Reveal";
import { site } from "@/lib/data/site";

const beliefs = [
  "She deserves dignity.",
  "She deserves knowledge.",
  "She deserves mentorship.",
  "She deserves opportunity.",
  "She deserves a future.",
];

export function BeliefSection() {
  return (
    <section className="bg-background">
      <div className="mx-auto max-w-6xl px-5 py-24 sm:px-8 lg:py-32">
        <Reveal>
          <p className="section-kicker text-primary">
            <b>03</b>
            The turn
          </p>
          <p className="mt-6 font-display text-2xl italic text-muted sm:text-3xl">
            But the story doesn&apos;t end there.
          </p>
          <h2 className="display-lg mt-6 max-w-4xl">
            We believe every girl deserves more than survival.
          </h2>
        </Reveal>
        <ul className="mt-12 space-y-4">
          {beliefs.map((line) => (
            <li key={line} className="belief-line">
              {line}
            </li>
          ))}
        </ul>
        <Reveal delay={0.08} className="mt-16 max-w-2xl">
          <p className="font-display text-4xl text-primary-dark">{site.name}</p>
          <p className="mt-2 italic text-primary">{site.tagline}</p>
          <p className="prose-nfs mt-6">{site.description}</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <ButtonLink href="/programs" variant="plum">
              Explore Our Work
            </ButtonLink>
            <ButtonLink href="/donate" variant="ghost">
              Support Her Journey
            </ButtonLink>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
