import { estimateSolar, monthlyKwhPerPanel } from "@/lib/solar";
import { formatInteger, formatOneDecimal, formatUsd, formatUsdWhole } from "@/lib/format";
import type { CityContent } from "./types";

/**
 * Phoenix, AZ — source of truth for the city page.
 * FAQ answers are built from these same values so numbers can never drift.
 */
const data = {
  slug: "phoenix-az",
  city: "Phoenix",
  state: "AZ",
  stateFull: "Arizona",
  metroArea: "Phoenix–Mesa–Chandler",
  utilityName: "Arizona Public Service",
  utilityRatePerKwh: 0.15,
  peakSunHoursPerDay: 6.5,
  panelWatts: 450,
  performanceRatio: 0.8,
  costPerWattInstalled: 2.75,
  minPanels: 8,
  federalCreditRate: 0.3,
  stateIncentiveNote:
    "Arizona adds a state tax credit worth 25% of the system cost, capped at $1,000. It is not included in the estimate below.",
  installsCompleted: 1840,
  crewsAvailable: 12,
  avgRating: 4.8,
  avgPermitDays: 21,
  phone: "(602) 555-0147",
  popularNeighborhoods: ["Arcadia", "Ahwatukee", "Desert Ridge", "Encanto", "Laveen"],
  householdProfiles: [
    { label: "Apartment or small condo, 1–2 people", typicalBill: 90 },
    { label: "Three-bedroom house, no pool", typicalBill: 220 },
    { label: "Four-bedroom house with central AC", typicalBill: 310 },
    { label: "House with a pool and an EV in the garage", typicalBill: 430 },
  ],
  crews: [
    {
      name: "Ray O. and team",
      installs: 412,
      rating: 4.9,
      since: 2019,
      blurb:
        "Tile roofs are their specialty. They mount without cracking a single tile and photograph every penetration.",
    },
    {
      name: "Danielle W. and team",
      installs: 287,
      rating: 5.0,
      since: 2021,
      blurb:
        "Handles the permit paperwork with the city herself, which is why her jobs clear inspection first time.",
    },
    {
      name: "The Okafor brothers",
      installs: 533,
      rating: 4.8,
      since: 2018,
      blurb:
        "Fastest crew on flat roofs. A standard twenty-panel system goes up in a single day.",
    },
  ],
  testimonials: [
    {
      quote:
        "My summer bill used to hit $380 in July. The first summer after the install it was $61. The crew was on my roof for one day and I barely knew they were there.",
      author: "Marta R.",
      neighborhood: "Ahwatukee",
      date: "2025-08-11",
    },
    {
      quote:
        "I got three quotes. Brightfield was the only one that showed me the math instead of just a monthly payment, so I could tell what I was actually buying.",
      author: "Kevin D.",
      neighborhood: "Arcadia",
      date: "2025-06-27",
    },
    {
      quote:
        "Permit took about three weeks, which they told me upfront. No surprises, no change orders, and the final invoice matched the quote to the dollar.",
      author: "Sandra P.",
      neighborhood: "Desert Ridge",
      date: "2025-09-04",
    },
  ],
  simulatorDefaults: { monthlyBill: 220, coveragePercent: 80 },
} satisfies Omit<CityContent, "faqs">;

// Worked examples for the FAQ, computed with the same function as the simulator.
const perPanelKwh = monthlyKwhPerPanel(data);
const typical = estimateSolar(
  {
    monthlyBill: data.simulatorDefaults.monthlyBill,
    coveragePercent: data.simulatorDefaults.coveragePercent,
  },
  data,
);
const smallest = estimateSolar({ monthlyBill: 60, coveragePercent: 50 }, data);
const creditPct = Math.round(data.federalCreditRate * 100);

export const phoenixAz: CityContent = {
  ...data,
  faqs: [
    {
      question: `How many solar panels does a ${data.city} home need?`,
      answer:
        `It depends on your bill, not your square footage. We divide your average bill by ${data.utilityName}'s rate (${formatUsd(data.utilityRatePerKwh)} per kWh) to get your monthly usage, take the share you want to cover, and divide by what one ${data.panelWatts} W panel produces here: about ${formatInteger(perPanelKwh)} kWh a month.` +
        `\n\nWe always round up, and we never install fewer than ${data.minPanels} panels. A ${formatUsdWhole(typical.monthlyBill)} monthly bill at ${typical.coveragePercent}% coverage works out to ${typical.panels} panels.`,
    },
    {
      question: `How much does solar cost in ${data.city}?`,
      answer:
        `Installed systems here run ${formatUsd(data.costPerWattInstalled)} per watt before incentives. The ${creditPct}% federal tax credit comes off that, so our smallest system (${smallest.panels} panels) is ${formatUsd(smallest.netInvestment)} after the credit, down from ${formatUsd(smallest.grossSystemCost)}. The ${typical.panels}-panel example above comes to ${formatUsd(typical.netInvestment)}.` +
        `\n\nArizona also has a state tax credit worth 25% of the system cost, capped at $1,000. We leave it out of every estimate so the number you see is never better than the one you'll pay.`,
    },
    {
      question: "How long until the system pays for itself?",
      answer:
        `Payback is the cost after the federal credit divided by one year of savings. For the ${formatUsdWhole(typical.monthlyBill)}-a-month household above that is about ${formatOneDecimal(typical.paybackYears)} years.` +
        `\n\nIt is a deliberately simple number: it assumes today's electricity rate stays flat, ignores panel degradation and financing, and leaves out the state credit. Your written quote replaces those assumptions with your roof and your actual usage history.`,
    },
    {
      question: "What happens to the extra energy my panels produce?",
      answer:
        `On bright afternoons your system can make more power than the house is using. That surplus goes to the grid and ${data.utilityName} credits it against later bills. It does not turn into a check.` +
        `\n\nThat is why the simulator caps your savings at your bill, even when the panels could produce more than you use.`,
    },
    {
      question: "How long does it take from signing to switching on?",
      answer:
        `Most of the wait is paperwork. Permits in ${data.city} take about ${data.avgPermitDays} days on average, and we tell you that on day one. A standard twenty-panel system goes up in a single day.` +
        `\n\nAfter the install the city inspects the work and ${data.utilityName} approves the connection. We handle both and tell you the date you can switch on.`,
    },
    {
      question: "What if I sell my house?",
      answer:
        "A system you own transfers with the house, like a new roof or air conditioner. We give you a folder with the permit, the final inspection, the equipment warranties and your utility connection approval, so buyers and appraisers can see exactly what they are getting.",
    },
  ],
};
