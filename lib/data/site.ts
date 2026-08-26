export const site = {
  name: "Nazarene for She",
  legalName: "Nazarene for She",
  tagline: "She Empowered, Community Inspired.",
  shortTagline: "She empowered, Community inspired.",
  description:
    "Nazarene for She equips adolescent girls and young women in Kenyan informal settlements with the information, resources, mentorship, faith and practical skills they need to navigate puberty with dignity and step into their potential.",
  tenSecondStory:
    "Nazarene for She helps girls and young women in Kenya overcome period poverty, protect their dignity, grow through mentorship and faith, develop practical skills, and build sustainable futures beyond poverty.",
  url:
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.NODE_ENV === "production"
      ? "https://nazarene-for-she.workers.dev"
      : "http://localhost:3000"),
  locale: "en_KE",
  country: "Kenya",
  foundingContext: "Church of the Nazarene community initiative",
  girlsSupported: {
    value: 600,
    display: "600+",
    label: "Girls currently supported",
    verified: true,
  },
  contact: {
    email: process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "",
    phone: process.env.NEXT_PUBLIC_CONTACT_PHONE ?? "",
    location:
      "Kenya — working with adolescent girls and young women in informal settlements.",
    locationPlaceholder: true,
  },
  social: {
    instagram: process.env.NEXT_PUBLIC_INSTAGRAM_URL ?? "",
    facebook: process.env.NEXT_PUBLIC_FACEBOOK_URL ?? "",
    linkedin: process.env.NEXT_PUBLIC_LINKEDIN_URL ?? "",
    youtube: process.env.NEXT_PUBLIC_YOUTUBE_URL ?? "",
    tiktok: process.env.NEXT_PUBLIC_TIKTOK_URL ?? "",
  },
  keywords: [
    "Nazarene for She",
    "menstrual health Kenya",
    "period poverty Kenya",
    "girls empowerment Kenya",
    "menstrual hygiene",
    "women empowerment",
    "vocational training Kenya",
    "girls education",
    "community empowerment",
    "mentorship for girls",
    "dignity kits",
  ],
} as const;

export type SiteConfig = typeof site;
