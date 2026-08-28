import Image from "next/image";
import Link from "next/link";
import { PageIntro } from "@/components/ui/PageIntro";
import { programs } from "@/lib/data/programs";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "How We Empower",
  description:
    "From sanitary pads to mentorship, tailoring and enterprise — how Nazarene for She walks with girls and young women in Kawangware, Nairobi.",
  path: "/programs",
});

export default function ProgramsPage() {
  return (
    <>
      <PageIntro kicker="How we empower" title="A kit for today. A skill for tomorrow. A community for both.">
        <p>
          Each programme is a chapter of the same story: dignity, knowledge, faith, skill and
          independence. Choose a path to walk.
        </p>
      </PageIntro>
      <div className="mx-auto max-w-6xl px-5 pb-24 sm:px-8">
        <div className="grid gap-10 lg:grid-cols-2">
          {programs.map((program) => (
            <article key={program.slug} className="grid gap-5 border-t border-line pt-8 sm:grid-cols-5">
              <div className="relative aspect-[4/3] sm:col-span-2">
                <Image
                  src={program.visual}
                  alt=""
                  fill
                  sizes="(min-width: 1024px) 20vw, 100vw"
                  className="object-cover"
                />
              </div>
              <div className="sm:col-span-3">
                <p className="eyebrow text-accent">{program.eyebrow}</p>
                <h2 className="mt-2 font-display text-3xl">
                  <Link href={`/programs/${program.slug}`} className="hover:text-primary">
                    {program.name}
                  </Link>
                </h2>
                <p className="mt-3 text-muted">{program.summary}</p>
                <Link href={`/programs/${program.slug}`} className="mt-4 inline-block text-sm font-semibold text-primary">
                  Discover this work →
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </>
  );
}
