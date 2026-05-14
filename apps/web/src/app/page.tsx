import { Nav } from '@/components/landing/nav';
import { Hero } from '@/components/landing/hero';
import { ProblemSection } from '@/components/landing/problem-section';
import { FeaturesSection } from '@/components/landing/features-section';
import { LivePreview } from '@/components/landing/live-preview';
import { HowItWorks } from '@/components/landing/how-it-works';
import { Testimonials } from '@/components/landing/testimonials';
import { BottomCta } from '@/components/landing/bottom-cta';
import { Footer } from '@/components/landing/footer';

export default function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-gl-bg text-gl-text">
      {/* Full-width sage + cream halo behind the nav and hero */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 z-0 h-[1100px]"
        style={{
          background: `
            radial-gradient(70% 45% at 50% 0%, rgba(111, 200, 160, 0.16) 0%, transparent 65%),
            radial-gradient(45% 35% at 50% 25%, rgba(242, 234, 211, 0.04) 0%, transparent 80%),
            linear-gradient(to bottom, transparent 55%, var(--gl-bg) 100%)
          `,
        }}
        aria-hidden="true"
      />

      {/* Content — constrained to max-width, padded */}
      <div className="relative z-10 mx-auto max-w-[1200px] px-5 sm:px-8 lg:px-12">
        <Nav />
        <Hero />
        <ProblemSection />
        <FeaturesSection />
        <LivePreview />
        <HowItWorks />
        <Testimonials />
        <BottomCta />
        <Footer />
      </div>
    </div>
  );
}
