import type { SolarAssumptions } from "@/lib/solar";

export interface HouseholdProfile {
  label: string;
  /** Typical monthly bill for this household in the city, USD. */
  typicalBill: number;
}

export interface Crew {
  name: string;
  installs: number;
  rating: number;
  /** Year the crew started installing with Brightfield. */
  since: number;
  blurb: string;
}

export interface Testimonial {
  quote: string;
  author: string;
  neighborhood: string;
  /** ISO date, YYYY-MM-DD. */
  date: string;
}

export interface Faq {
  question: string;
  /** Plain text. Paragraphs are separated by a blank line ("\n\n"). */
  answer: string;
}

/**
 * Everything that varies from one city page to the next.
 *
 * The template in `src/app/solar/[city]` only reads from this shape, so adding
 * a city means adding one data file and registering it in `./index.ts`.
 */
export interface CityContent extends SolarAssumptions {
  /** URL segment, e.g. "phoenix-az". Must be unique. */
  slug: string;
  city: string;
  /** Two-letter postal abbreviation. */
  state: string;
  stateFull: string;
  metroArea: string;

  utilityName: string;
  /** Informational only — never used in the calculation. */
  stateIncentiveNote: string;

  installsCompleted: number;
  crewsAvailable: number;
  avgRating: number;
  avgPermitDays: number;
  /** Local phone number, human-formatted, e.g. "(602) 555-0147". */
  phone: string;

  popularNeighborhoods: string[];
  householdProfiles: HouseholdProfile[];
  crews: Crew[];
  testimonials: Testimonial[];
  faqs: Faq[];

  /** Where the simulator starts. */
  simulatorDefaults: {
    monthlyBill: number;
    coveragePercent: number;
  };
}
