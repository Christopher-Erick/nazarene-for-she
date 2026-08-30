import { stories } from "@/lib/data/stories";
import { libraryImages } from "@/lib/data/library-images";

export type Program = {
  slug: string;
  name: string;
  eyebrow: string;
  summary: string;
  explanation: string;
  impact: string;
  donationCategory: string;
  cta: { label: string; href: string };
  secondaryCta?: { label: string; href: string };
  visual: string;
};

const programDefs: Program[] = [
  {
    slug: "menstrual-health",
    name: "Menstrual Health & Dignity",
    eyebrow: "Knowledge",
    summary:
      "Awareness, education and access so a monthly cycle never becomes a reason to leave school.",
    explanation:
      "We teach girls and young women how their bodies work, how to manage menstruation safely, and how to protect their dignity. Education comes first — so a pad is never the whole story.",
    impact:
      "Girls who understand their bodies can stay in class, ask for what they need, and make informed choices.",
    donationCategory: "Menstrual Health",
    cta: { label: "Help her stay in school", href: "/donate?cause=menstrual-health" },
    visual: libraryImages.menstrualHealth,
  },
  {
    slug: "dignity-kits",
    name: "Dignity Kits",
    eyebrow: "Access",
    summary:
      "Sanitary pads, underwear and hygiene items — so she can manage menstruation safely and confidently.",
    explanation:
      "Continued distribution of dignity kits — including sanitary pads, underwear and hygiene items — helps girls manage menstruation safely, confidently and with dignity. The kit meets today's need. The work around it builds tomorrow.",
    impact:
      "A kit is not a transaction. It is a practical way to remove a barrier between a girl and her education.",
    donationCategory: "Dignity Kits",
    cta: { label: "Help provide a dignity kit", href: "/donate?cause=dignity-kits" },
    visual: libraryImages.dignityKit,
  },
  {
    slug: "mentorship",
    name: "Mentorship",
    eyebrow: "Guidance",
    summary:
      "Someone walking beside her — with knowledge, experience and care.",
    explanation:
      "Mentorship gives girls and young women a trusted adult and peer community. We walk with them through questions of identity, health, relationships, school and work — without replacing their own agency.",
    impact:
      "A girl with a mentor is less likely to face hard choices alone.",
    donationCategory: "Mentorship",
    cta: { label: "Walk beside her", href: "/get-involved#mentor" },
    visual: libraryImages.mentorship,
  },
  {
    slug: "discipleship",
    name: "Discipleship",
    eyebrow: "Faith",
    summary:
      "A community that gathers to share the Word and Love of Jesus Christ.",
    explanation:
      "Nazarene for She is rooted in a community that gathers not only to provide practical support, but also to share the Word and Love of Jesus Christ. Discipleship, prayer and spiritual encouragement sit alongside skills and education — never instead of them.",
    impact:
      "Faith is offered as strength and belonging, not as a condition of receiving help.",
    donationCategory: "General Support",
    cta: { label: "Pray with us", href: "/get-involved#pray" },
    visual: "/images/atmosphere-community.webp",
  },
  {
    slug: "vocational-training",
    name: "Vocational Training",
    eyebrow: "Skill",
    summary:
      "Tailoring and dressmaking — marketable skills she can build a living with.",
    explanation:
      "Through practical vocational training in tailoring and dressmaking, girls and young women with limited educational or economic opportunities can acquire marketable skills for employment or entrepreneurship. A thread becomes fabric. Fabric becomes clothing. Clothing becomes income.",
    impact:
      "Skill is a form of dignity that lasts longer than a single donation.",
    donationCategory: "Vocational Training",
    cta: { label: "Support her skill", href: "/donate?cause=vocational-training" },
    secondaryCta: { label: "Wear her work", href: "/shop" },
    visual: "/images/atmosphere-atelier.webp",
  },
  {
    slug: "entrepreneurship",
    name: "Entrepreneurship",
    eyebrow: "Enterprise",
    summary:
      "Business skills that turn a craft into a livelihood.",
    explanation:
      "We do not only want to help girls survive difficult circumstances. We want to help them build the capacity to shape their own futures — through small enterprise, market awareness, and the confidence to sell what they make.",
    impact:
      "Enterprise is how a skill becomes a future.",
    donationCategory: "Entrepreneurship",
    cta: { label: "Invest in her enterprise", href: "/donate?cause=entrepreneurship" },
    secondaryCta: { label: "Wear her work", href: "/shop" },
    visual: "/images/atmosphere-atelier.webp",
  },
  {
    slug: "skills-development",
    name: "Skills Development",
    eyebrow: "Capacity",
    summary:
      "Practical capabilities for sustainable livelihoods.",
    explanation:
      "Beyond a single trade, we invest in the wider skills girls and young women need to work, lead and support one another — from hygiene education to financial basics and collaborative making.",
    impact:
      "Skills compound. Each one she gains makes the next opportunity more reachable.",
    donationCategory: "Vocational Training",
    cta: { label: "Expand her capacity", href: "/donate?cause=vocational-training" },
    visual: "/images/atmosphere-fabric.webp",
  },
  {
    slug: "health-awareness",
    name: "Health Awareness",
    eyebrow: "Knowledge",
    summary:
      "Community awareness of HIV/AIDS and related challenges, with specific attention to young girls.",
    explanation:
      "The constitution calls the organisation to increase general awareness of HIV/AIDS and its related problems, with specific attention to young girls. This sits beside menstrual health education: information that belongs to her, offered without stigma.",
    impact:
      "Awareness is protection. Young girls deserve facts about their health, not silence.",
    donationCategory: "Menstrual Health",
    cta: { label: "Support health education", href: "/donate?cause=menstrual-health" },
    visual: "/images/atmosphere-community.webp",
  },
  {
    slug: "financial-independence",
    name: "Financial Independence",
    eyebrow: "Future",
    summary:
      "Supporting women toward self-sufficiency — not perpetual dependence.",
    explanation:
      "The long arc of our work is independence: income she can name as her own, choices she does not have to trade for survival, and a community that is increasingly able to sustain itself.",
    impact:
      "Independence is the point. Charity is the starting path, not the destination.",
    donationCategory: "General Support",
    cta: { label: "Build her future with us", href: "/donate?cause=general" },
    visual: "/images/atmosphere-rooftops.webp",
  },
];

/** Related stories are derived from story → program links to avoid drift. */
export function relatedStorySlugsFor(programSlug: string) {
  return stories
    .filter((story) => story.relatedProgramSlugs.includes(programSlug))
    .map((story) => story.slug);
}

export const programs = programDefs.map((program) => ({
  ...program,
  relatedStorySlugs: relatedStorySlugsFor(program.slug),
}));

export type ProgramWithStories = (typeof programs)[number];

export function getProgram(slug: string) {
  return programs.find((program) => program.slug === slug);
}

export const programSlugs = programs.map((program) => program.slug);
