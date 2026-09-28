import { phoenixAz } from "./phoenix-az";
import type { CityContent } from "./types";

export type { CityContent } from "./types";

/**
 * City registry. To launch a new city page:
 *   1. copy `phoenix-az.ts` to `<city>-<state>.ts` and replace the values;
 *   2. add it to this array.
 * Routes, metadata, the sitemap and Open Graph images pick it up automatically.
 */
const CITIES: readonly CityContent[] = [phoenixAz];

const bySlug = new Map<string, CityContent>(CITIES.map((c) => [c.slug, c]));

if (bySlug.size !== CITIES.length) {
  throw new Error("Duplicate city slug in src/content/cities/index.ts");
}

export function getAllCities(): readonly CityContent[] {
  return CITIES;
}

export function getCityBySlug(slug: string): CityContent | undefined {
  return bySlug.get(slug);
}
