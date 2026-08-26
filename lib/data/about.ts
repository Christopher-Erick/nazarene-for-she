export const aboutContent = {
  whoWeAre: {
    title: "Who we are",
    body: "Nazarene for She is a Kenyan community-focused initiative that exists to equip adolescent girls and young women in informal settlements with the information, resources, mentorship, faith and practical skills they need to safely navigate puberty, preserve their dignity, discover their potential, and build sustainable futures.",
  },
  ourStory: {
    title: "Our story",
    body: "The work began by confronting a simple injustice: a girl should never have to miss school, compromise her dignity, or depend on exploitation to manage her period. From dignity kits and menstrual health education, the mission widened — because a pad can solve today, and empowerment can change tomorrow.",
  },
  mission: {
    title: "Our mission",
    status: "draft" as const,
    body: "[Draft — replace with approved organisational wording.] To equip girls and young women with dignity, knowledge, faith, mentorship and marketable skills so they can remain in school, make informed choices, and build lives of independence.",
  },
  vision: {
    title: "Our vision",
    status: "draft" as const,
    body: "[Draft — replace with approved organisational wording.] A community where girls and young women are self-supporting, spiritually grounded, and free to shape their own futures — and where the initiative itself grows toward sustainability.",
  },
  values: {
    title: "Our values",
    status: "draft" as const,
    items: [
      { name: "Dignity", body: "She is not a problem to be solved. She is a person with potential who deserves opportunity." },
      { name: "Knowledge", body: "Information about her body and her choices belongs to her." },
      { name: "Faith", body: "We share the Word and Love of Jesus Christ as belonging and strength, never as a gate." },
      { name: "Community", body: "Transformation is personal, but it is never solitary." },
      { name: "Skill", body: "What she can make and earn is part of her freedom." },
      { name: "Integrity", body: "We do not invent impact. We wait for verified numbers and consented stories." },
    ],
  },
  approach: {
    title: "Our approach",
    body: "We address immediate challenges while working toward long-term transformation: Dignity → Knowledge → Confidence → Faith → Skills → Opportunity → Independence → Transformation.",
  },
  faith: {
    title: "Faith & discipleship",
    body: "Nazarene for She is rooted in a community that gathers not only to provide practical support, but also to share the Word and Love of Jesus Christ. Discipleship, prayer and spiritual encouragement sit beside pads, training and enterprise.",
  },
  community: {
    title: "Community",
    body: "The work lives among girls, young women, mentors, churches and neighbours in Kenyan informal settlements. We do not parachute in with pity. We walk with people we know.",
  },
  sustainability: {
    title: "Sustainability",
    body: "We are developing a model that can make the initiative increasingly self-sustainable: support, skills, enterprise, income, self-sufficiency. We do not claim that the work is already fully self-sustaining. That is the direction, not the present tense.",
  },
};

export const partnershipContent = {
  intro:
    "You are not simply funding a program. You are helping build pathways to dignity, skills and independence.",
  audiences: [
    "Churches",
    "NGOs",
    "Individual donors",
    "Corporate partners",
    "Development organisations",
    "Government and community institutions",
  ],
  categories: [
    { name: "Menstrual health", body: "Education, products and the right to stay in school." },
    { name: "Education", body: "Removing the monthly barrier between a girl and her classroom." },
    { name: "Vocational training", body: "Tailoring, dressmaking and the tools of a trade." },
    { name: "Entrepreneurship", body: "Turning skill into income." },
    { name: "Mentorship", body: "People who will walk with her." },
    { name: "Faith / community", body: "Discipleship, prayer and belonging." },
    { name: "Sustainability", body: "Helping the model move from dependence toward possibility." },
  ],
};

export const events: Array<{
  slug: string;
  title: string;
  date: string;
  status: "placeholder";
  summary: string;
}> = [];

export const partners: Array<{
  name: string;
  href?: string;
  status: "placeholder";
}> = [];
