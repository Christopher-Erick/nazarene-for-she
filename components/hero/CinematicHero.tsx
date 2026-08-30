import { ButtonLink } from "@/components/ui/ButtonLink";
import { HeroPhotoSlideshow } from "@/components/hero/HeroPhotoSlideshow";
import { ThreadMark } from "@/components/ui/ThreadMark";
import { supportCta } from "@/lib/data/navigation";
import { site } from "@/lib/data/site";

export function CinematicHero() {
  return (
    <section className="hero-stage bleed-hero">
      <HeroPhotoSlideshow />
      <div className="hero-veil" aria-hidden="true" />
      <div className="grain" />

      <div className="hero-copy-panel">
        <div className="hero-kicker flex items-center gap-4">
          <span className="hidden h-px w-10 bg-accent sm:block" aria-hidden="true" />
          <p className="eyebrow text-accent-soft">Kenya · Kawangware, Nairobi · Her future</p>
        </div>

        <h1 className="hero-headline display-xl mt-6">
          A girl should never have to choose between her <ThreadMark>dignity</ThreadMark> and
          her future.
        </h1>

        <p className="hero-copy mt-6 max-w-lg text-base leading-relaxed text-ivory/88 sm:text-lg">
          In Kawangware, Nairobi, period poverty interrupts education,
          opportunity and dignity. {site.name} exists so that interruption is not the end of
          her story.
        </p>

        <div className="hero-actions hero-copy">
          <ButtonLink href="#reality">See Her Story</ButtonLink>
          <ButtonLink href={supportCta.href} variant="ivory">
            {supportCta.label}
          </ButtonLink>
        </div>

        <p className="hero-stat hero-copy text-sm text-ivory/70">
          <span className="font-display text-2xl text-accent-soft">{site.girlsSupported.display}</span>
          <span className="ml-3 tracking-wide">{site.girlsSupported.label}</span>
        </p>
      </div>
    </section>
  );
}
