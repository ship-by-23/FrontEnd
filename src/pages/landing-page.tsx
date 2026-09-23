import {
  BookmarkletSection,
  CapabilityStrip,
  FaqSection,
  FeatureCardsSection,
  FinalCtaSection,
  HighlightsSection,
  HeroSection,
  HowItWorksSection,
  LandingFooter,
  LandingNavbar,
  PrivacySection,
  ProductStorySection,
  ReaderShowcaseSection,
  ReadingJourneySection,
  SearchShowcaseSection,
  TagsSection,
} from "../features/landing/components/landing-sections";

// Menyusun seluruh perjalanan landing page sesuai urutan PRD SimpanDulu.
export function LandingPage() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-[var(--cream)] text-[var(--text)]">
      <LandingNavbar />
      <main>
        <HeroSection />
        <ProductStorySection />
        <FeatureCardsSection />
        <ReadingJourneySection />
        <ReaderShowcaseSection />
        <SearchShowcaseSection />
        <HighlightsSection />
        <TagsSection />
        <CapabilityStrip />
        <HowItWorksSection />
        <BookmarkletSection />
        <PrivacySection />
        <FaqSection />
        <FinalCtaSection />
      </main>
      <LandingFooter />
    </div>
  );
}
