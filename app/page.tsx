import dynamic from "next/dynamic";
import { CinematicHero } from "@/components/hero/CinematicHero";
import { RealitySection } from "@/components/storytelling/RealitySection";
import { ScrollRibbon } from "@/components/experience/ScrollRibbon";

const ChoiceSection = dynamic(() =>
  import("@/components/storytelling/ChoiceSection").then((m) => m.ChoiceSection),
);
const BeliefSection = dynamic(() =>
  import("@/components/storytelling/BeliefSection").then((m) => m.BeliefSection),
);
const ResponseSection = dynamic(() =>
  import("@/components/storytelling/ResponseSection").then((m) => m.ResponseSection),
);
const DignityKitSection = dynamic(() =>
  import("@/components/storytelling/DignityKitSection").then((m) => m.DignityKitSection),
);
const FaithSection = dynamic(() =>
  import("@/components/storytelling/FaithSection").then((m) => m.FaithSection),
);
const BeyondPadSection = dynamic(() =>
  import("@/components/storytelling/BeyondPadSection").then((m) => m.BeyondPadSection),
);
const VocationalSection = dynamic(() =>
  import("@/components/storytelling/VocationalSection").then((m) => m.VocationalSection),
);
const EntrepreneurshipSection = dynamic(() =>
  import("@/components/storytelling/EntrepreneurshipSection").then(
    (m) => m.EntrepreneurshipSection,
  ),
);
const TransformationSection = dynamic(() =>
  import("@/components/storytelling/TransformationSection").then(
    (m) => m.TransformationSection,
  ),
);
const ImpactSection = dynamic(() =>
  import("@/components/storytelling/ImpactSection").then((m) => m.ImpactSection),
);
const StoriesTeaser = dynamic(() =>
  import("@/components/storytelling/StoriesTeaser").then((m) => m.StoriesTeaser),
);
const InvolveSection = dynamic(() =>
  import("@/components/storytelling/InvolveSection").then((m) => m.InvolveSection),
);
const SustainabilitySection = dynamic(() =>
  import("@/components/storytelling/SustainabilitySection").then(
    (m) => m.SustainabilitySection,
  ),
);
const WordRiver = dynamic(() =>
  import("@/components/storytelling/WordRiver").then((m) => m.WordRiver),
);
const ClosingCta = dynamic(() =>
  import("@/components/storytelling/ClosingCta").then((m) => m.ClosingCta),
);

export default function HomePage() {
  return (
    <div className="relative">
      <ScrollRibbon />
      <CinematicHero />
      <RealitySection />
      <ChoiceSection />
      <BeliefSection />
      <ResponseSection />
      <DignityKitSection />
      <FaithSection />
      <BeyondPadSection />
      <VocationalSection />
      <EntrepreneurshipSection />
      <TransformationSection />
      <ImpactSection />
      <StoriesTeaser />
      <InvolveSection />
      <SustainabilitySection />
      <WordRiver tone="dark" />
      <ClosingCta />
    </div>
  );
}
