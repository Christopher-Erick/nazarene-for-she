import Image from "next/image";
import Link from "next/link";
import { Reveal } from "@/components/experience/Reveal";

const responses = [
  {
    href: "/programs/menstrual-health",
    index: "01",
    title: "Menstrual health",
    body: "Knowledge about her body, her cycle, and her right to stay in school.",
    image: "/images/atmosphere-classroom.webp",
  },
  {
    href: "/programs/dignity-kits",
    index: "02",
    title: "Dignity kits",
    body: "Pads, underwear and hygiene — access without humiliation.",
    image: "/images/atmosphere-dignity-kit.webp",
  },
  {
    href: "/programs/mentorship",
    index: "03",
    title: "Mentorship",
    body: "Someone walking beside her as she makes hard, ordinary decisions.",
    image: "/images/atmosphere-community.webp",
  },
  {
    href: "/programs/discipleship",
    index: "04",
    title: "Community",
    body: "A gathering that holds faith, friendship and practical care together.",
    image: "/images/atmosphere-community.webp",
  },
];

export function ResponseSection() {
  return (
    <section className="bg-background">
      <div className="mx-auto max-w-6xl px-5 py-24 sm:px-8 lg:py-32">
        <Reveal>
          <p className="section-kicker text-primary">
            <b>04</b>
            What we are doing
          </p>
          <h2 className="display-lg mt-5 max-w-4xl">The response is immediate — and more than a kit.</h2>
        </Reveal>
        <div className="mt-14 grid gap-6 sm:grid-cols-2">
          {responses.map((item, index) => (
            <Reveal key={item.title} delay={index * 0.06}>
              <Link href={item.href} className="group block">
                <div className="photo-frame relative aspect-[16/10] overflow-hidden">
                  <Image
                    src={item.image}
                    alt=""
                    fill
                    sizes="(min-width: 640px) 45vw, 100vw"
                    className="object-cover"
                  />
                </div>
                <p className="eyebrow mt-5 text-accent">{item.index}</p>
                <h3 className="mt-2 font-display text-3xl transition-colors group-hover:text-primary">
                  {item.title}
                </h3>
                <p className="mt-2 max-w-md text-muted">{item.body}</p>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
