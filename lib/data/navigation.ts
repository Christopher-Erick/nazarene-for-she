export const primaryNav = [
  { href: "/", label: "Home", short: "Home" },
  { href: "/about", label: "Why We Exist", short: "Our Story" },
  { href: "/programs", label: "How We Empower", short: "Our Work" },
  { href: "/impact", label: "Impact", short: "Impact" },
  { href: "/stories", label: "Stories", short: "Stories" },
  { href: "/get-involved", label: "Get Involved", short: "Get Involved" },
] as const;

export const supportCta = {
  href: "/donate",
  label: "Support A Girl",
} as const;

export const footerNav = {
  story: [
    { href: "/", label: "Home" },
    { href: "/about", label: "Why We Exist" },
    { href: "/impact", label: "Impact" },
    { href: "/stories", label: "Stories" },
    { href: "/partnership", label: "Partner With Us" },
  ],
  work: [
    { href: "/programs", label: "How We Empower" },
    { href: "/programs/menstrual-health", label: "Menstrual Health" },
    { href: "/programs/dignity-kits", label: "Dignity Kits" },
    { href: "/programs/vocational-training", label: "Vocational Training" },
    { href: "/programs/entrepreneurship", label: "Entrepreneurship" },
  ],
  involved: [
    { href: "/get-involved", label: "Ways to Walk With Her" },
    { href: "/donate", label: "Support A Girl" },
    { href: "/contact", label: "Start a Conversation" },
    { href: "/get-involved#pray", label: "Pray" },
    { href: "/get-involved#mentor", label: "Mentor" },
  ],
  legal: [
    { href: "/privacy", label: "Privacy" },
    { href: "/terms", label: "Terms" },
  ],
} as const;
