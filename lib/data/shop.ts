export const shop = {
  name: "The Atelier",
  path: "/shop",
  kicker: "The Kawangware workshop",
  tagline: "Wear what she made.",
  intro:
    "Girls and young women in Kawangware cut, sew and finish these pieces as vocational training becomes livelihood. When you buy a dress, a uniform, a kitenge or a tote, you are paying her — not speaking for her.",
  cta: "She's learning to cut, sew and finish — piece by piece, skill by skill. When you buy what she's made, you're not just supporting a program. You're giving her a future she's building herself.",
  ctaLine: "Shop, and be part of her story.",
  howItWorks: [
    {
      step: "01",
      title: "Choose her work",
      body: "Choose from dresses, skirts, uniforms, kitenges, totes and more. Nothing is charged on this site.",
    },
    {
      step: "02",
      title: "We confirm",
      body: "The workshop replies with a fair price, a making time, and official payment details.",
    },
    {
      step: "03",
      title: "She is paid",
      body: "You pay through those official channels. The piece leaves the table as her work, sold.",
    },
  ],
} as const;

export const cloths = [
  { id: "plum", name: "Plum", hex: "#5e2063" },
  { id: "gold", name: "Gold", hex: "#c47a2c" },
  { id: "ivory", name: "Ivory", hex: "#f7f1e8" },
  { id: "wax", name: "Wax print", hex: "#7a3a82" },
] as const;

export type ClothId = (typeof cloths)[number]["id"];

export const garmentFits = ["s", "m", "l", "os", "custom"] as const;
export type GarmentFit = (typeof garmentFits)[number];

export const fitLabels: Record<GarmentFit, string> = {
  s: "S",
  m: "M",
  l: "L",
  os: "One size",
  custom: "Custom",
};

export const collections = [
  {
    id: "wear",
    name: "She wears it",
    kicker: "On her body",
    title: "Made to be worn",
    cta: "Open this rack",
    lure: "A dress she cut. A palazzo she draped. When you wear it, a girl is paid for a trade — not pitied for a need.",
  },
  {
    id: "day",
    name: "She works in it",
    kicker: "For her day",
    title: "Made for her day",
    cta: "Open this rack",
    lure: "Uniforms, trousers, jackets, sweaters — the clothes of a working life, sewn by hands that are learning one.",
  },
  {
    id: "carry",
    name: "She sends it home",
    kicker: "From her hands",
    title: "Made to send home",
    cta: "Open this rack",
    lure: "A tote, a kitenge, a cap. You carry the craft. She keeps the income.",
  },
] as const;

export type CollectionId = (typeof collections)[number]["id"];

export type Garment = {
  slug: string;
  collection: CollectionId;
  name: string;
  eyebrow: string;
  verb: string;
  summary: string;
  lure: string;
  explanation: string;
  sizing: "body" | "one";
};

export const garments: Garment[] = [
  {
    slug: "dress",
    collection: "wear",
    name: "Dresses",
    eyebrow: "Made to order",
    verb: "Cut",
    summary: "A dress cut and sewn in the workshop — work she can name as her own.",
    lure: "When she finishes a dress, it is not charity leaving the table. It is a girl paid.",
    explanation:
      "Dresses are made to order from the Kawangware atelier. A picture of the finished piece, and a fair price, come when the workshop confirms your request.",
    sizing: "body",
  },
  {
    slug: "skirt",
    collection: "wear",
    name: "Skirts",
    eyebrow: "Made to order",
    verb: "Drape",
    summary: "A skirt from the same tables where she learned the machine.",
    lure: "A skirt she draped is a skill you can wear — and a wage she can keep.",
    explanation:
      "Skirts are sewn as training becomes livelihood. Choose a fit, and wait for the workshop to confirm cloth, timeline and price before any money moves.",
    sizing: "body",
  },
  {
    slug: "blouse",
    collection: "wear",
    name: "Blouses",
    eyebrow: "Made to order",
    verb: "Stitch",
    summary: "A blouse finished by hands that are learning a trade.",
    lure: "Every stitch on a blouse is practice that can become independence.",
    explanation:
      "Blouses are part of dressmaking practice. Your request is an order conversation with the organisation — not a card checkout, and not a claim that a specific garment is already on a hanger.",
    sizing: "body",
  },
  {
    slug: "palazzo",
    collection: "wear",
    name: "Palazzos",
    eyebrow: "Made to order",
    verb: "Flow",
    summary: "Wide-leg palazzos cut so a girl can sell the ease she sewed.",
    lure: "Palazzos she made can walk out of Kawangware as her work, sold.",
    explanation:
      "Palazzos are made to order in the workshop. Tell us a cloth and a fit. The team will confirm what they can take on — and the price — before you pay.",
    sizing: "body",
  },
  {
    slug: "kimono",
    collection: "wear",
    name: "Kimonos",
    eyebrow: "Made to order",
    verb: "Wrap",
    summary: "A kimono wrapped from the same cloth she is learning to honour.",
    lure: "Wrap yourself in her craft. Let the payment wrap around her future.",
    explanation:
      "Kimonos and wraps are sewn to order. Choose a cloth on the table, then wait for the workshop to answer with timeline and price.",
    sizing: "body",
  },
  {
    slug: "crop-top",
    collection: "wear",
    name: "Crop tops",
    eyebrow: "Made to order",
    verb: "Crop",
    summary: "A crop top finished on the machines where she is becoming a tailor.",
    lure: "Small piece. Real wage. The girl who cropped it is the one you are paying.",
    explanation:
      "Crop tops are made to order as part of dressmaking practice. Choose a fit and a cloth. Price is confirmed before any money moves.",
    sizing: "body",
  },
  {
    slug: "jumpsuit",
    collection: "wear",
    name: "Jumpsuits",
    eyebrow: "Made to order",
    verb: "Join",
    summary: "A jumpsuit joined at the same seam she is learning to trust.",
    lure: "One garment, many skills — cutting, fitting, finishing. Buying it pays all of them.",
    explanation:
      "Jumpsuits are a fuller make: cut, fit and finish. Request one and the workshop will say what they can sew, when, and for how much, before you pay.",
    sizing: "body",
  },
  {
    slug: "uniform",
    collection: "day",
    name: "Uniforms",
    eyebrow: "Made to order",
    verb: "Stand",
    summary: "A uniform sewn so a girl can be paid for work that looks like dignity.",
    lure: "A uniform she sewed can dress a working day — and fund hers.",
    explanation:
      "Uniforms are made to order in the Kawangware workshop as part of vocational training. Tell us who will wear it and a size. The organisation confirms cloth, timeline and price before you pay.",
    sizing: "body",
  },
  {
    slug: "trouser",
    collection: "day",
    name: "Trousers",
    eyebrow: "Made to order",
    verb: "Tailor",
    summary: "Trousers tailored on the tables where she is building a trade.",
    lure: "Trousers she tailored are not a favour. They are a girl earning from skill.",
    explanation:
      "Trousers are sewn to order. Choose a fit, note a cloth, and wait for the workshop to confirm price and making time.",
    sizing: "body",
  },
  {
    slug: "jacket",
    collection: "day",
    name: "Jackets",
    eyebrow: "Made to order",
    verb: "Line",
    summary: "A jacket lined by hands that are learning structure, not only style.",
    lure: "A jacket takes time. Paying for that time is how training becomes income.",
    explanation:
      "Jackets are a longer make. Request one and the workshop will answer with what they can take on, a timeline, and a fair price before you pay.",
    sizing: "body",
  },
  {
    slug: "sweater",
    collection: "day",
    name: "Sweaters",
    eyebrow: "Made to order",
    verb: "Warm",
    summary: "A sweater finished so her warmth can also be her wage.",
    lure: "Wear the warmth she made. Let the payment stay with her.",
    explanation:
      "Sweaters are made to order in the workshop. Choose a size and a cloth preference. Price is confirmed in the reply, not on this page.",
    sizing: "body",
  },
  {
    slug: "tote",
    collection: "carry",
    name: "Tote bags",
    eyebrow: "Made to order",
    verb: "Carry",
    summary: "A tote bag she carried through every step — cut, stitch, finish.",
    lure: "Carry her work on your shoulder. That weight is a girl's income.",
    explanation:
      "Tote bags are sewn in the Kawangware atelier as part of vocational training. They are made to order. A fair price comes when the workshop confirms your request.",
    sizing: "one",
  },
  {
    slug: "kitenge",
    collection: "carry",
    name: "Kitenges",
    eyebrow: "Made to order",
    verb: "Wrap",
    summary: "A kitenge wrapped from cloth she is learning to cut with care.",
    lure: "A kitenge is cloth with a life in it. Buying one pays the girl who finished it.",
    explanation:
      "Kitenges are cut and finished to order. Choose a cloth on the table, tell us how it should live, and wait for the workshop to confirm price and timing.",
    sizing: "one",
  },
  {
    slug: "cap",
    collection: "carry",
    name: "Caps",
    eyebrow: "Made to order",
    verb: "Crown",
    summary: "A cap finished by a girl whose skill is becoming a livelihood.",
    lure: "A small crown. A real wage. Choosing it means you are paying her — not speaking for her.",
    explanation:
      "Caps are made to order in the workshop. Choose one, note a cloth, and the organisation will reply with a fair price before any money moves.",
    sizing: "one",
  },
];

export const garmentSlugs = garments.map((garment) => garment.slug);

export function getGarment(slug: string) {
  return garments.find((garment) => garment.slug === slug);
}

export function getCloth(id: string) {
  return cloths.find((cloth) => cloth.id === id);
}

export function getCollection(id: string) {
  return collections.find((collection) => collection.id === id);
}

export const workshopStills = {
  fabric: {
    src: "/images/atmosphere-fabric.webp",
    alt: "Placeholder: draped Kenyan wax-print fabric, not a finished garment.",
  },
  atelier: {
    src: "/images/atmosphere-atelier.webp",
    alt: "Placeholder: a tailoring table with thread, scissors and cloth, not a finished garment.",
  },
  thread: {
    src: "/images/atmosphere-thread.webp",
    alt: "Placeholder: gold thread and folded cloth on a workshop table, not a finished garment.",
  },
} as const;

export type StillId = keyof typeof workshopStills;

/** Category chips, in shop-by-piece order. */
export const categoryOrder = [
  "skirt",
  "dress",
  "blouse",
  "tote",
  "kitenge",
  "palazzo",
  "kimono",
  "uniform",
  "sweater",
  "trouser",
  "jacket",
  "crop-top",
  "jumpsuit",
  "cap",
] as const;

const stillBySlug: Record<string, StillId> = {
  skirt: "atelier",
  dress: "fabric",
  blouse: "thread",
  tote: "thread",
  kitenge: "fabric",
  palazzo: "fabric",
  kimono: "atelier",
  uniform: "atelier",
  sweater: "thread",
  trouser: "atelier",
  jacket: "thread",
  "crop-top": "fabric",
  jumpsuit: "atelier",
  cap: "thread",
};

export function stillFor(slug: string) {
  return workshopStills[stillBySlug[slug] ?? "atelier"];
}

export function garmentsIn(collectionId: CollectionId) {
  return garments.filter((garment) => garment.collection === collectionId);
}

export function fitsFor(garment: Garment): GarmentFit[] {
  return garment.sizing === "one" ? ["os", "custom"] : ["s", "m", "l", "custom"];
}

export function defaultFit(garment: Garment): GarmentFit {
  return garment.sizing === "one" ? "os" : "m";
}
