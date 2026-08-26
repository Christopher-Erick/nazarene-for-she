import Image from "next/image";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { DignityObjects } from "@/components/storytelling/DignityObjects";
import { Reveal } from "@/components/experience/Reveal";

export function DignityKitSection() {
  return (
    <section className="theme-band">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 py-24 sm:px-8 lg:grid-cols-2 lg:py-32">
        <Reveal>
          <p className="section-kicker text-accent">
            <b>05</b>
            Dignity kits
          </p>
          <h2 className="display-lg mt-5">She should never have to trade her dignity for a pad.</h2>
          <p className="mt-6 text-lg theme-muted">
            Continued distribution of dignity kits — sanitary pads, underwear and hygiene items —
            helps girls manage menstruation safely, confidently and with dignity.
          </p>
          <p className="mt-4 theme-muted">This is not a shop. It is how a barrier is removed.</p>
          <div className="mt-8">
            <ButtonLink href="/donate?cause=dignity-kits">Help Provide a Dignity Kit</ButtonLink>
          </div>
        </Reveal>
        <Reveal delay={0.1}>
          <div className="photo-frame relative aspect-[4/3] overflow-hidden">
            <Image
              src="/images/atmosphere-dignity-kit.webp"
              alt="A carefully arranged dignity kit on linen: wrapped pads, soap, a notebook and folded cloth."
              fill
              sizes="(min-width: 1024px) 40vw, 100vw"
              className="object-cover"
            />
          </div>
          <DignityObjects />
        </Reveal>
      </div>
    </section>
  );
}
