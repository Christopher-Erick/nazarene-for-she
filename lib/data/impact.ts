export type MetricStatus = "verified" | "awaiting-verification";

export type ImpactMetric = {
  id: string;
  value: string;
  label: string;
  status: MetricStatus;
  note?: string;
};

export const impactMetrics: ImpactMetric[] = [
  {
    id: "girls-supported",
    value: "600+",
    label: "Girls currently supported",
    status: "verified",
    note: "Verified organisational figure.",
  },
  {
    id: "girls-reached",
    value: "—",
    label: "Girls reached",
    status: "awaiting-verification",
  },
  {
    id: "dignity-kits",
    value: "—",
    label: "Dignity kits distributed",
    status: "awaiting-verification",
  },
  {
    id: "mentorship-sessions",
    value: "—",
    label: "Mentorship sessions",
    status: "awaiting-verification",
  },
  {
    id: "health-sessions",
    value: "—",
    label: "Menstrual health sessions",
    status: "awaiting-verification",
  },
  {
    id: "vocational-trainees",
    value: "—",
    label: "Vocational trainees",
    status: "awaiting-verification",
  },
  {
    id: "entrepreneurship",
    value: "—",
    label: "Entrepreneurship beneficiaries",
    status: "awaiting-verification",
  },
  {
    id: "partners",
    value: "—",
    label: "Community partners",
    status: "awaiting-verification",
  },
];

export const transformationModel = [
  {
    id: "before",
    title: "Before",
    body: "Limited access to information, products and people who can walk with her.",
  },
  {
    id: "knowledge",
    title: "Knowledge",
    body: "Understanding her body — so a cycle is information, not a crisis.",
  },
  {
    id: "dignity",
    title: "Dignity",
    body: "Access to menstrual products and hygiene, without having to trade who she is.",
  },
  {
    id: "mentorship",
    title: "Mentorship",
    body: "Someone walking beside her as she makes decisions about school, work and faith.",
  },
  {
    id: "skills",
    title: "Skills",
    body: "Learning something she can build with — a trade that belongs to her.",
  },
  {
    id: "opportunity",
    title: "Opportunity",
    body: "Turning skills into income, and income into choices.",
  },
  {
    id: "independence",
    title: "Independence",
    body: "Building a sustainable future. This is a model of holistic empowerment — not a single path every girl is expected to walk in the same way.",
  },
] as const;

export const sustainabilityPath = [
  { id: "support", title: "Support", body: "Dignity kits, education and community care meet urgent need." },
  { id: "skills", title: "Skills", body: "Vocational training and mentorship grow what she can do." },
  { id: "enterprise", title: "Enterprise", body: "Making and selling becomes a practised capacity." },
  { id: "income", title: "Income", body: "Work she can name as her own." },
  { id: "self-sufficiency", title: "Self-sufficiency", body: "A community increasingly able to sustain its own future." },
] as const;
