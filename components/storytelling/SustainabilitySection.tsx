import { sustainabilityPath } from "@/lib/data/impact";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { Reveal } from "@/components/experience/Reveal";

export function SustainabilitySection() {
  return (
    <section className="bg-background">
      <div className="mx-auto max-w-6xl px-5 py-24 sm:px-8 lg:py-32">
        <Reveal>
          <p className="section-kicker text-primary">
            <b>14</b>
            What future are we building
          </p>
          <h2 className="display-lg mt-5">From dependence to possibility.</h2>
          <p className="mt-6 max-w-2xl text-lg text-muted">
            We are developing a model that can make the initiative increasingly self-sustainable.
            That is the vision — not a claim that the work is already fully self-sustaining.
          </p>
        </Reveal>
        <ol className="sustain-flow mt-16">
          {sustainabilityPath.map((step, index) => (
            <li key={step.id} className="sustain-step">
              <span>{String(index + 1).padStart(2, "0")}</span>
              <h3>{step.title}</h3>
              <p>{step.body}</p>
            </li>
          ))}
        </ol>
        <div className="mt-16 flex flex-col gap-3 sm:flex-row">
          <ButtonLink href="/about" variant="plum">
            Why we exist
          </ButtonLink>
          <ButtonLink href="/partnership" variant="ghost">
            Partner in the longer work
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}
