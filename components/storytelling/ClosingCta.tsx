import { ButtonLink } from "@/components/ui/ButtonLink";
import { Reveal } from "@/components/experience/Reveal";
import { site } from "@/lib/data/site";

export function ClosingCta() {
  return (
    <section className="bg-plum text-ivory">
      <div className="mx-auto max-w-4xl px-5 py-28 text-center sm:px-8 lg:py-32">
        <Reveal>
          <p className="eyebrow text-accent">She empowered. Community inspired.</p>
          <h2 className="display-lg mt-8">This is not simply about sanitary pads.</h2>
          <p className="mx-auto mt-6 max-w-2xl font-display text-2xl italic text-accent-soft sm:text-3xl">
            It is about a future she can claim as her own.
          </p>
          <p className="mx-auto mt-8 max-w-2xl text-ivory/70">{site.tenSecondStory}</p>
          <div className="mt-12 flex flex-col justify-center gap-3 sm:flex-row">
            <ButtonLink href="/donate">Support Her Future</ButtonLink>
            <ButtonLink href="/contact" variant="ghost">
              Start a Conversation
            </ButtonLink>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
