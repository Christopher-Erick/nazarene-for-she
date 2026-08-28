import { isPublicContactEmail } from "@/lib/security";

const constitutionEmail = "nazareneforshe@gmail.com";

function resolvePublicContactEmail() {
  for (const candidate of [process.env.NEXT_PUBLIC_CONTACT_EMAIL, constitutionEmail]) {
    const email = candidate?.trim() ?? "";
    if (isPublicContactEmail(email)) return email;
  }
  return "";
}

export const site = {
  name: "Nazarene for She",
  legalName: "Nazarene for She",
  abbreviation: "NS",
  tagline: "She Empowered, Community Inspired.",
  shortTagline: "She empowered, Community inspired.",
  description:
    "Nazarene for She (NS) is a community-based organisation in Congo, Kawangware, Nairobi County. It empowers young girls through sanitary pads, vocational skills, and economic opportunity.",
  tenSecondStory:
    "Nazarene for She helps girls and young women in Kawangware, Nairobi, overcome period poverty, stay in school, gain practical skills, and move toward self-sustaining futures.",
  url:
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.NODE_ENV === "production"
      ? "https://nazarene-for-she.workers.dev"
      : "http://localhost:3000"),
  locale: "en_KE",
  country: "Kenya",
  foundingYear: 2021,
  foundingContext:
    "Community-based organisation in Nairobi County, constituted January 2021.",
  registeredAs: "Community-based organisation (Nairobi County Community Based Services Department)",
  girlsSupported: {
    value: 600,
    display: "600+",
    label: "Girls currently supported",
    verified: true,
  },
  contact: {
    email: resolvePublicContactEmail(),
    phone: process.env.NEXT_PUBLIC_CONTACT_PHONE ?? "",
    postalAddress: "P.O. Box 20025-00200 Nairobi, Kenya",
    location: "Congo, Kawangware, Nairobi County, Kenya.",
    locationPlaceholder: false,
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
    "Nazarene for She Kawangware",
    "menstrual health Kenya",
    "period poverty Kenya",
    "girls empowerment Nairobi",
    "menstrual hygiene",
    "women empowerment",
    "vocational training Kenya",
    "handmade garments Kawangware",
    "community based organisation Nairobi",
  ],
} as const;

export type SiteConfig = typeof site;
