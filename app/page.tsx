import { Suspense } from "react";
import { CinematicHero } from "@/components/hero/CinematicHero";
import { RealitySection } from "@/components/storytelling/RealitySection";
import { ScrollRibbon } from "@/components/experience/ScrollRibbon";
import { ChoiceSection } from "@/components/storytelling/ChoiceSection";
import { BeliefSection } from "@/components/storytelling/BeliefSection";
import { ResponseSection } from "@/components/storytelling/ResponseSection";
import { DignityKitSection } from "@/components/storytelling/DignityKitSection";
import { FaithSection } from "@/components/storytelling/FaithSection";
import { BeyondPadSection } from "@/components/storytelling/BeyondPadSection";
import { VocationalSection } from "@/components/storytelling/VocationalSection";
import { EntrepreneurshipSection } from "@/components/storytelling/EntrepreneurshipSection";
import { TransformationSection } from "@/components/storytelling/TransformationSection";
import { ImpactSection } from "@/components/storytelling/ImpactSection";
import { StoriesTeaser } from "@/components/storytelling/StoriesTeaser";
import { InvolveSection } from "@/components/storytelling/InvolveSection";
import { SustainabilitySection } from "@/components/storytelling/SustainabilitySection";
import { WordRiver } from "@/components/storytelling/WordRiver";
import { ClosingCta } from "@/components/storytelling/ClosingCta";
import { girlsSupportedFromImpact, publishedImpact } from "@/lib/cms/public-content";

async function HomeHero() {
  const girls = girlsSupportedFromImpact(await publishedImpact());
  return (
    <>
      <CinematicHero girlsDisplay={girls.display} girlsLabel={girls.label} />
      <RealitySection girlsValue={girls.value} girlsLabel={girls.label} verified={girls.verified} />
    </>
  );
}

export default function HomePage() {
  return (
    <div className="relative">
      <ScrollRibbon />
      <Suspense
        fallback={
          <>
            <CinematicHero />
            <RealitySection />
          </>
        }
      >
        <HomeHero />
      </Suspense>
      <ChoiceSection />
      <BeliefSection />
      <ResponseSection />
      <DignityKitSection />
      <FaithSection />
      <BeyondPadSection />
      <VocationalSection />
      <EntrepreneurshipSection />
      <TransformationSection />
      <Suspense fallback={<section className="bg-background min-h-[20rem]" aria-hidden="true" />}>
        <ImpactSection />
      </Suspense>
      <Suspense fallback={<section className="bg-background min-h-[16rem]" aria-hidden="true" />}>
        <StoriesTeaser />
      </Suspense>
      <Suspense fallback={<section className="theme-band min-h-[20rem]" aria-hidden="true" />}>
        <InvolveSection />
      </Suspense>
      <SustainabilitySection />
      <WordRiver tone="dark" />
      <ClosingCta />
    </div>
  );
}
