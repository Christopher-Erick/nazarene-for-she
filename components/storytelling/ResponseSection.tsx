import Image from "next/image";
import Link from "next/link";
import { Reveal } from "@/components/experience/Reveal";
import { libraryImages } from "@/lib/data/library-images";

const responses = [
  {
    href: "/programs/menstrual-health",
    index: "01",
    title: "Menstrual health",
    body: "Knowledge about her body, her cycle, and her right to stay in school.",
    image: libraryImages.menstrualHealth,
    alt: "Girls in Kawangware learning about menstrual health with Nazarene for She.",
  },
  {
    href: "/programs/dignity-kits",
    index: "02",
    title: "Dignity kits",
    body: "Pads, underwear and hygiene — access without humiliation.",
    image: libraryImages.dignityKit,
    alt: "A Nazarene for She dignity kit with sanitary pads and essentials for a girl.",
  },
  {
    href: "/programs/mentorship",
    index: "03",
    title: "Mentorship",
    body: "Someone walking beside her as she makes hard, ordinary decisions.",
    image: libraryImages.mentorship,
    alt: "A mentorship session with girls and young women in Kawangware, Nairobi.",
  },
  {
    href: "/programs/discipleship",
    index: "04",
    title: "Community",
    body: "A gathering that holds faith, friendship and practical care together.",
    image: libraryImages.community,
    alt: "The Nazarene for She community gathered together in Kawangware.",
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
                <div className="photo-frame photo-frame--library relative aspect-[3/2] overflow-hidden">
                  <Image
                    src={item.image}
                    alt={item.alt}
                    fill
                    sizes="(min-width: 640px) 45vw, 100vw"
                    className="library-photo object-cover object-center"
                    quality={80}
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
