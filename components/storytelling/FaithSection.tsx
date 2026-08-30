import Image from "next/image";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { Reveal } from "@/components/experience/Reveal";
import { libraryImages } from "@/lib/data/library-images";

export function FaithSection() {
  return (
    <section className="theme-band">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 py-24 sm:px-8 lg:grid-cols-2 lg:py-32">
        <Reveal>
          <div className="photo-frame photo-frame--library relative aspect-[3/2] overflow-hidden">
            <Image
              src={libraryImages.mentorship}
              alt="Mentorship — someone walking beside her as she makes hard, ordinary decisions."
              fill
              sizes="(min-width: 1024px) 40vw, 100vw"
              className="library-photo object-cover object-center"
              quality={80}
            />
          </div>
        </Reveal>
        <Reveal delay={0.08}>
          <p className="section-kicker text-accent">
            <b>06</b>
            Faith & community
          </p>
          <h2 className="display-lg mt-5">Rooted in the Word, open to every girl.</h2>
          <p className="mt-6 text-lg theme-muted">
            Nazarene for She is rooted in a community that gathers not only to provide
            practical support, but also to share the Word and Love of Jesus Christ.
          </p>
          <ul className="mt-8 space-y-3 text-lg">
            {["Discipleship", "Mentorship", "Prayer", "Community", "Spiritual encouragement"].map(
              (item) => (
                <li key={item} className="faith-line">
                  <span className="h-px w-8 bg-accent" />
                  {item}
                </li>
              ),
            )}
          </ul>
          <div className="mt-8">
            <ButtonLink href="/get-involved#pray">Pray with us</ButtonLink>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
