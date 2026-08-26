import { Reveal } from "@/components/experience/Reveal";

export function BeyondPadSection() {
  return (
    <section className="theme-band">
      <div className="mx-auto max-w-6xl px-5 py-24 sm:px-8 lg:py-32">
        <Reveal>
          <p className="section-kicker text-accent">
            <b>07</b>
            What comes next
          </p>
          <h2 className="beyond-type mt-8">
            A pad can solve today.
            <em>Empowerment changes tomorrow.</em>
          </h2>
          <p className="mt-12 max-w-xl text-lg theme-muted">
            We do not stop at distribution. The longer work is knowledge, mentorship, skill,
            enterprise and a community that can increasingly sustain itself.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
