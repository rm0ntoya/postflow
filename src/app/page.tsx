import "./landing3.css";
import { Landing3Nav } from "@/components/landing3/Landing3Nav";
import { Landing3Hero } from "@/components/landing3/Landing3Hero";
import { WorkflowSection } from "@/components/landing3/WorkflowSection";
import { ViralEngineSection } from "@/components/landing3/ViralEngineSection";
import { FeatureEditorialGrid } from "@/components/landing3/FeatureEditorialGrid";
import { NewsModeSection } from "@/components/landing3/NewsModeSection";
import { SocialProofStrip } from "@/components/landing3/SocialProofStrip";
import { PricingSection } from "@/components/landing3/PricingSection";
import { FAQSection } from "@/components/landing3/FAQSection";
import { Landing3Footer } from "@/components/landing3/Landing3Footer";
import { CursorHalo } from "@/components/landing3/CursorHalo";

export default function Landing3Page() {
  return (
    <main className="landing3 min-h-screen bg-bg-base text-text-primary">
      <CursorHalo />
      <Landing3Nav />
      <Landing3Hero />
      <SocialProofStrip />
      <WorkflowSection />
      <ViralEngineSection />
      <FeatureEditorialGrid />
      <NewsModeSection />
      <PricingSection />
      <FAQSection />
      <Landing3Footer />
    </main>
  );
}
