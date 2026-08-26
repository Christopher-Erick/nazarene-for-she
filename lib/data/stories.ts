export type StoryStatus = "published" | "placeholder";

export type Story = {
  slug: string;
  status: StoryStatus;
  firstName: string;
  age?: number;
  community: string;
  portrait: string;
  portraitAlt: string;
  challenge: string;
  experience: string;
  transformation: string;
  aspiration: string;
  relatedProgramSlugs: string[];
};

/**
 * Real beneficiary stories are published only with explicit consent.
 * Until those stories are approved, this collection holds clearly marked
 * placeholders so the page architecture is ready for a CMS.
 */
export const stories: Story[] = [
  {
    slug: "her-story-forthcoming",
    status: "placeholder",
    firstName: "Her story — forthcoming",
    community: "To be confirmed with consent",
    portrait: "/images/atmosphere-classroom.webp",
    portraitAlt:
      "Sunlit Kenyan classroom with open notebooks. Placeholder for a consented portrait.",
    challenge:
      "[Placeholder] Each published story will name a real challenge a girl or young woman faced — in her words, with her permission.",
    experience:
      "[Placeholder] This space will describe her experience with Nazarene for She: dignity kits, mentorship, faith community, or vocational training.",
    transformation:
      "[Placeholder] Transformation will be told as agency, not rescue — what she learned, made, or chose next.",
    aspiration:
      "[Placeholder] Future aspirations will be published only when she wants them shared.",
    relatedProgramSlugs: ["mentorship", "dignity-kits"],
  },
  {
    slug: "skills-story-forthcoming",
    status: "placeholder",
    firstName: "A maker’s story — forthcoming",
    community: "To be confirmed with consent",
    portrait: "/images/atmosphere-atelier.webp",
    portraitAlt:
      "Tailoring table with gold thread, scissors and folded fabric. Placeholder for a consented portrait.",
    challenge:
      "[Placeholder] Vocational stories will describe limited educational or economic opportunity without reducing anyone to poverty imagery.",
    experience:
      "[Placeholder] Training in tailoring and dressmaking — the thread becoming skill.",
    transformation:
      "[Placeholder] What she can now make, sell or teach. Outcomes will be verified before they appear here.",
    aspiration:
      "[Placeholder] Her own words about the future she is building.",
    relatedProgramSlugs: ["vocational-training", "entrepreneurship"],
  },
  {
    slug: "community-story-forthcoming",
    status: "placeholder",
    firstName: "A community story — forthcoming",
    community: "To be confirmed with consent",
    portrait: "/images/atmosphere-community.webp",
    portraitAlt:
      "Lantern-lit community gathering space. Placeholder for a consented portrait.",
    challenge:
      "[Placeholder] Community stories will show belonging, discipleship and mutual support — not spectacle.",
    experience:
      "[Placeholder] Mentorship, prayer and practical care, told with consent.",
    transformation:
      "[Placeholder] How community changed the path she could see for herself.",
    aspiration:
      "[Placeholder] Aspirations shared on her terms.",
    relatedProgramSlugs: ["discipleship", "mentorship"],
  },
];

export function getStory(slug: string) {
  return stories.find((story) => story.slug === slug);
}

export const publishedStories = stories.filter((story) => story.status === "published");
