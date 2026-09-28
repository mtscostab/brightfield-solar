import type { CityContent } from "@/content/cities";
import { Analytics } from "./Analytics";
import { Faq } from "./Faq";
import { FinalCta } from "./FinalCta";
import { Hero } from "./Hero";
import { JsonLd } from "./JsonLd";
import { MobileCtaBar } from "./MobileCtaBar";
import { MotionController } from "./MotionController";
import { Process } from "./Process";
import { SimulatorSection } from "./SimulatorSection";
import { SiteFooter } from "./SiteFooter";
import { SiteHeader } from "./SiteHeader";
import { SocialProof } from "./SocialProof";

/**
 * The city page template. It renders whatever CityContent it is given and
 * contains no city-specific values of its own.
 */
export function CityLandingPage({ city }: { city: CityContent }) {
  return (
    <>
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <SiteHeader city={city} />
      <main id="main">
        {/* Order is part of the brief: hero → simulator → process → proof → FAQ → CTA */}
        <Hero city={city} />
        <SimulatorSection city={city} />
        <Process city={city} />
        <SocialProof city={city} />
        <Faq city={city} />
        <FinalCta city={city} />
      </main>
      <SiteFooter city={city} />
      <MobileCtaBar city={city} />
      <JsonLd city={city} />
      <Analytics city={city.slug} />
      <div className="scroll-progress" aria-hidden="true" />
      <MotionController />
    </>
  );
}
