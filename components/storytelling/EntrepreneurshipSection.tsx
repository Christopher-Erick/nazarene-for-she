import { Reveal } from "@/components/experience/Reveal";

const pillars = [
  {
    title: "Skills",
    body: "Practical capability she can take into a workshop, a stall, or a small room at home.",
  },
  {
    title: "Enterprise",
    body: "The knowledge to price, make and sell — so a garment can become a living.",
  },
  {
    title: "Mentorship",
    body: "Someone who has walked a path, walking a stretch of hers.",
  },
  {
    title: "Independence",
    body: "Income she can name. Choices she does not have to trade for survival.",
  },
];

export function EntrepreneurshipSection() {
  return (
    <section className="bg-background">
      <div className="mx-auto max-w-6xl px-5 py-24 sm:px-8 lg:py-32">
        <Reveal>
          <p className="section-kicker text-primary">
            <b>09</b>
            Enterprise
          </p>
          <h2 className="display-lg mt-5 max-w-4xl">
            We do not only want to help girls survive. We want them to shape their own futures.
          </h2>
        </Reveal>
        <div className="mt-16 grid gap-10 sm:grid-cols-2">
          {pillars.map((pillar, index) => (
            <article key={pillar.title} className="pillar-card">
              <p className="eyebrow text-accent">0{index + 1}</p>
              <h3 className="mt-3 font-display text-3xl text-primary-dark">{pillar.title}</h3>
              <p className="mt-3 max-w-md text-muted">{pillar.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
