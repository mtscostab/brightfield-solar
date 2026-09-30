import type { CityContent } from "@/content/cities";
import { Simulator, type SimulatorCity } from "./Simulator";

export function SimulatorSection({ city }: { city: CityContent }) {
  // Pass only what the client needs — keeps the RSC payload small.
  const simulatorCity: SimulatorCity = {
    slug: city.slug,
    city: city.city,
    utilityName: city.utilityName,
    stateIncentiveNote: city.stateIncentiveNote,
    householdProfiles: city.householdProfiles,
    simulatorDefaults: city.simulatorDefaults,
    utilityRatePerKwh: city.utilityRatePerKwh,
    peakSunHoursPerDay: city.peakSunHoursPerDay,
    panelWatts: city.panelWatts,
    performanceRatio: city.performanceRatio,
    costPerWattInstalled: city.costPerWattInstalled,
    minPanels: city.minPanels,
    federalCreditRate: city.federalCreditRate,
  };

  return (
    <section id="estimate" className="section section-tint" aria-labelledby="estimate-title">
      <div className="container">
        <header className="section-head" data-stagger="">
          <p className="eyebrow">Savings simulator</p>
          <h2 id="estimate-title">What would solar save you in {city.city}?</h2>
          <p>
            Move the sliders and every number updates instantly. We don&rsquo;t ask for your contact details, and we use anonymous usage analytics to improve this calculator.
            It&rsquo;s your math to check.
          </p>
        </header>
        <div data-reveal="scale">
          <Simulator city={simulatorCity} />
        </div>
      </div>
    </section>
  );
}
