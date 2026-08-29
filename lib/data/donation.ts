export type DonationCategory = {
  id: string;
  name: string;
  description: string;
};

export type DonationMethod = {
  id: "mpesa" | "bank" | "mchanga";
  name: string;
  description: string;
  fields: Array<{ label: string; value: string; placeholder: boolean }>;
};

export const donationIntro =
  "Your contribution can help provide practical support today while helping build sustainable opportunities for tomorrow. You are not simply funding a program. You are helping remove a barrier between a girl and her future.";

export const donationLandingHook =
  "When you give, a girl gets help she can feel today — pads, school, skill, and people beside her.";

export const donationLandingLead = "Pick the way that is yours. Every path walks with her, not over her.";

export const donationWizardGiveCta =
  "When you give, a girl gets help she can feel today — pads, school, skill, and people beside her. That is a good thing to do.";

export const donationThankYou = {
  title: "Thank you for walking with her.",
  body: "Your gift helps remove a barrier between a girl and her future — whether that is dignity today, skill for tomorrow, or community around her. Use the official payment details below when you are ready to give.",
  noteReceived:
    "We have received your note. The team will follow up through official channels and thank you properly.",
};

export const donationWizardSteps = [
  { id: 1, label: "Your gift" },
  { id: 2, label: "Payment" },
  { id: 3, label: "Thank you" },
] as const;

export const donationCategories: DonationCategory[] = [
  {
    id: "dignity-kits",
    name: "Dignity Kits",
    description: "Sanitary pads, underwear and hygiene items.",
  },
  {
    id: "menstrual-health",
    name: "Menstrual Health",
    description: "Education and awareness that keeps girls in school.",
  },
  {
    id: "vocational-training",
    name: "Vocational Training",
    description: "Tailoring, dressmaking and tools for skill.",
  },
  {
    id: "entrepreneurship",
    name: "Entrepreneurship",
    description: "Business skills and the start of independent income.",
  },
  {
    id: "mentorship",
    name: "Mentorship",
    description: "People walking beside her.",
  },
  {
    id: "general",
    name: "General Support",
    description: "Where the need is greatest across the whole journey.",
  },
];

/**
 * Official payment details must be supplied by the organisation.
 * Never invent account numbers, paybill numbers or till numbers.
 */
export const donationMethods: DonationMethod[] = [
  {
    id: "mchanga",
    name: "M-Changa",
    description: "Give through the organisation’s M-Changa campaign when a live link is published.",
    fields: [{ label: "Campaign link", value: "", placeholder: true }],
  },
  {
    id: "mpesa",
    name: "M-Pesa Paybill",
    description: "Send directly via M-Pesa using the organisation’s official paybill.",
    fields: [
      { label: "Paybill number", value: "", placeholder: true },
      { label: "Account number / name", value: "", placeholder: true },
    ],
  },
  {
    id: "bank",
    name: "Bank transfer",
    description: "For partners and gifts that move through a bank account.",
    fields: [
      { label: "Bank", value: "", placeholder: true },
      { label: "Account name", value: "", placeholder: true },
      { label: "Account number", value: "", placeholder: true },
      { label: "Branch / SWIFT", value: "", placeholder: true },
    ],
  },
];

export const involvementPaths = [
  {
    id: "donate",
    title: "Donate",
    body: "Support menstrual health and dignity — and the skills that follow.",
    href: "/donate",
    cta: "Support A Girl",
  },
  {
    id: "atelier",
    title: "Wear her work",
    body: "Buy a garment from the workshop. A purchase is income she can name — not only a gift on her behalf.",
    href: "/shop",
    cta: "Enter the atelier",
  },
  {
    id: "mentor",
    title: "Mentor",
    body: "Share knowledge, experience and guidance with a girl who should not walk alone.",
    href: "/contact?intent=mentorship",
    cta: "Offer to mentor",
  },
  {
    id: "pray",
    title: "Pray",
    body: "Support the mission spiritually. Faith is part of how this community holds girls.",
    href: "/get-involved#pray",
    cta: "Pray with us",
  },
  {
    id: "partner",
    title: "Partner",
    body: "Churches, NGOs, companies and institutions can help build pathways, not just programmes.",
    href: "/partnership",
    cta: "Explore partnership",
  },
  {
    id: "resources",
    title: "Give resources",
    body: "Training materials, sanitary products, equipment and other resources — given with dignity.",
    href: "/contact?intent=resources",
    cta: "Offer resources",
  },
  {
    id: "skills",
    title: "Support skills development",
    body: "Help expand vocational and entrepreneurship opportunities beyond a single kit.",
    href: "/donate?cause=vocational-training",
    cta: "Invest in skills",
  },
] as const;
