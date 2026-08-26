import { BeliefSection } from "@/components/storytelling/BeliefSection";
import { BeyondPadSection } from "@/components/storytelling/BeyondPadSection";
import { ChoiceSection } from "@/components/storytelling/ChoiceSection";
import { ClosingCta } from "@/components/storytelling/ClosingCta";
import { DignityKitSection } from "@/components/storytelling/DignityKitSection";
import { EntrepreneurshipSection } from "@/components/storytelling/EntrepreneurshipSection";
import { FaithSection } from "@/components/storytelling/FaithSection";
import { CinematicHero } from "@/components/hero/CinematicHero";
import { ImpactSection } from "@/components/storytelling/ImpactSection";
import { InvolveSection } from "@/components/storytelling/InvolveSection";
import { RealitySection } from "@/components/storytelling/RealitySection";
import { ResponseSection } from "@/components/storytelling/ResponseSection";
import { StoriesTeaser } from "@/components/storytelling/StoriesTeaser";
import { SustainabilitySection } from "@/components/storytelling/SustainabilitySection";
import { TransformationSection } from "@/components/storytelling/TransformationSection";
import { VocationalSection } from "@/components/storytelling/VocationalSection";
import { WordRiver } from "@/components/storytelling/WordRiver";
import { ScrollRibbon } from "@/components/experience/ScrollRibbon";

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
