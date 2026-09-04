import Image from "next/image";
import { CountUp } from "@/components/impact/CountUp";
import { Reveal } from "@/components/experience/Reveal";
import { libraryImages } from "@/lib/data/library-images";
import { site } from "@/lib/data/site";

export function RealitySection({
  girlsValue = site.girlsSupported.value,
  girlsLabel = site.girlsSupported.label,
  verified = site.girlsSupported.verified,
}: {
  girlsValue?: number;
  girlsLabel?: string;
  verified?: boolean;
}) {
  return (
    <section id="reality" className="theme-band">
      <div className="mx-auto grid max-w-6xl gap-12 px-5 pt-24 pb-8 sm:px-8 lg:grid-cols-2 lg:items-center lg:pt-32 lg:pb-10">
        <Reveal>
          <p className="section-kicker text-accent">
            <b>01</b>
            What is happening
          </p>
          <h2 className="display-lg mt-5">
            Every month, a cycle can become a barrier to school.
          </h2>
          <p className="mt-6 max-w-xl text-lg theme-muted">
            For many girls, a period is more than biology. It can interrupt education, dignity
            and opportunity — especially where products are unaffordable, unavailable, or come
            with a cost no girl should ever have to pay.
          </p>
        </Reveal>
        <Reveal delay={0.12}>
          <p className="stat-number text-accent-soft">
            <CountUp value={girlsValue} suffix="+" />
          </p>
          <p className="mt-4 text-xl">{girlsLabel}</p>
          <p className="mt-2 text-sm theme-muted">
            {verified ? "Verified organisational figure." : "Published from the impact ledger."}
          </p>
        </Reveal>
      </div>
      <div className="relative mx-auto max-w-6xl px-5 pb-10 sm:px-8 lg:pb-12">
        <div className="photo-frame photo-frame--library relative aspect-[3/2] overflow-hidden">
          <Image
            src={libraryImages.schoolGoing}
            alt="Girls supported by Nazarene for She gathered outside school with dignity kits — staying in education with confidence."
            fill
            sizes="(min-width: 1152px) 72rem, 100vw"
            className="library-photo object-cover object-center"
            quality={80}
          />
        </div>
      </div>
    </section>
  );
}
