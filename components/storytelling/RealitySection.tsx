import Image from "next/image";
import { CountUp } from "@/components/impact/CountUp";
import { Reveal } from "@/components/experience/Reveal";
import { site } from "@/lib/data/site";

export function RealitySection() {
  return (
    <section id="reality" className="theme-band">
      <div className="mx-auto grid max-w-6xl gap-12 px-5 py-24 sm:px-8 lg:grid-cols-2 lg:items-center lg:py-32">
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
            <CountUp value={site.girlsSupported.value} suffix="+" />
          </p>
          <p className="mt-4 text-xl">{site.girlsSupported.label}</p>
          <p className="mt-2 text-sm theme-muted">Verified organisational figure.</p>
        </Reveal>
      </div>
      <div className="relative mx-auto max-w-6xl px-5 pb-24 sm:px-8">
        <div className="photo-frame relative aspect-[16/8] overflow-hidden">
          <Image
            src="/images/atmosphere-classroom.webp"
            alt="A sunlit Kenyan classroom with wooden desks, open notebooks and late-afternoon light."
            fill
            sizes="(min-width: 1152px) 72rem, 100vw"
            className="object-cover"
          />
        </div>
      </div>
    </section>
  );
}
