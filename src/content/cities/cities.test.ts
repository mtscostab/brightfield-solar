import { describe, expect, it } from "vitest";
import { BILL_RANGE, COVERAGE_RANGE, estimateSolar } from "@/lib/solar";
import { getAllCities, getCityBySlug } from "./index";

/**
 * Guard rails for the ~120 city files to come: a malformed data file should
 * fail CI, not ship a broken page.
 */
const onStep = (value: number, range: { min: number; max: number; step: number }) =>
  value >= range.min && value <= range.max && (value - range.min) % range.step === 0;

describe.each(getAllCities().map((c) => [c.slug, c] as const))("city content: %s", (slug, city) => {
  it("has a URL-safe slug ending in the state code", () => {
    expect(slug).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    expect(slug.endsWith(`-${city.state.toLowerCase()}`)).toBe(true);
    expect(getCityBySlug(slug)).toBe(city);
  });

  it("starts the simulator on a reachable slider position", () => {
    expect(onStep(city.simulatorDefaults.monthlyBill, BILL_RANGE)).toBe(true);
    expect(onStep(city.simulatorDefaults.coveragePercent, COVERAGE_RANGE)).toBe(true);
  });

  it("only offers household profiles the bill slider can represent", () => {
    expect(city.householdProfiles.length).toBeGreaterThan(0);
    for (const p of city.householdProfiles) expect(onStep(p.typicalBill, BILL_RANGE)).toBe(true);
  });

  it("produces a finite estimate across the whole input domain", () => {
    for (const bill of [BILL_RANGE.min, BILL_RANGE.max]) {
      for (const coverage of [COVERAGE_RANGE.min, COVERAGE_RANGE.max]) {
        const r = estimateSolar({ monthlyBill: bill, coveragePercent: coverage }, city);
        expect(Number.isFinite(r.paybackYears)).toBe(true);
        expect(r.panels).toBeGreaterThanOrEqual(city.minPanels);
      }
    }
  });

  it("has well-formed social proof and FAQs", () => {
    for (const t of city.testimonials) expect(Number.isNaN(Date.parse(`${t.date}T00:00:00Z`))).toBe(false);
    for (const c of city.crews) expect(c.rating).toBeLessThanOrEqual(5);
    expect(city.faqs.length).toBeGreaterThanOrEqual(6);
    expect(city.phone).toMatch(/^\(\d{3}\) \d{3}-\d{4}$/);
  });
});
