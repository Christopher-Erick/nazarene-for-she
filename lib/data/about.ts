export const aboutContent = {
  whoWeAre: {
    title: "Who we are",
    body: "Nazarene for She (NS) is a non-profit, non-partisan community-based organisation with offices in Congo, Kawangware, Nairobi County. The January 2021 constitution establishes the organisation to empower young girls through sanitary pads, vocational skills, and economic opportunity — especially where formal education has been interrupted.",
  },
  ourStory: {
    title: "Our story",
    body: "The constitution came into force in January 2021, with registration through Nairobi County’s Community Based Services Department. The work confronts a practical injustice: a girl should not have to miss school, compromise her dignity, or lose her future for want of a pad or a skill.",
  },
  mission: {
    title: "Our mission",
    status: "official" as const,
    source: "NS Constitution, January 2021, Article 2.2",
    body: "Empowering young girls through provision of sanitary pads and economic empowerment of school dropouts.",
  },
  vision: {
    title: "Our vision",
    status: "official" as const,
    source: "NS Constitution, January 2021, Article 2.1",
    body: "To create a self-sustaining generation of young women.",
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
  objectives: {
    title: "Our objectives",
    status: "official" as const,
    source: "NS Constitution, January 2021, Article 3",
    items: [
      {
        name: "Skills and education",
        body: "Improve practical skills and education so beneficiaries can become entrepreneurs, including youth with little or no chance of formal education.",
      },
      {
        name: "Sanitary pads",
        body: "Improve and promote provision of sanitary pads for every vulnerable girl in the community.",
      },
      {
        name: "Health awareness",
        body: "Increase general awareness of HIV/AIDS and related challenges, with specific attention to young girls.",
      },
      {
        name: "Collaboration",
        body: "Work with other organisations, bodies and individuals — national or international — who share this cause.",
      },
    ],
  },
  activities: {
    title: "What we do",
    status: "official" as const,
    source: "NS Constitution, January 2021, Article 3.2",
    items: [
      "Sanitary pads distribution",
      "Technical and soft skills training",
      "Community mobilisation, sensitisation, training and counselling",
    ],
  },
  approach: {
    title: "Our approach",
    body: "Immediate need and longer work sit together: pads so she can stay in school today; skills, enterprise and community so she can sustain herself tomorrow. Dignity → Knowledge → Confidence → Skills → Opportunity → Independence.",
  },
  faith: {
    title: "Faith & discipleship",
    body: "Nazarene for She is a community-based organisation, not a denomination. The community still gathers to share the Word and Love of Jesus Christ. Discipleship, prayer and spiritual encouragement sit beside pads, training and enterprise — never as a condition of receiving help.",
  },
  community: {
    title: "Community",
    body: "The work is based in Congo, Kawangware, Nairobi County. We walk with girls, young women, young mothers, mentors and neighbours we know — not as visitors dropping in with pity.",
  },
  sustainability: {
    title: "Sustainability",
    body: "The constitution names member contributions, donations, public support, and profits from output sales among lawful sources of funds. That is the direction of the work: support, skills, enterprise, income, self-sufficiency. We do not claim the organisation is already fully self-sustaining.",
  },
  leadership: {
    title: "Leadership",
    status: "partial" as const,
    body: "Executive officers will be published here when the organisation confirms the current committee. Personal names from older documents are not listed until that confirmation.",
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

export const partners: Array<{
  name: string;
  href?: string;
  status: "placeholder";
}> = [];
