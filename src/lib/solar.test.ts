import { describe, expect, it } from "vitest";
import { phoenixAz } from "@/content/cities/phoenix-az";
import {
  BILL_RANGE,
  COVERAGE_RANGE,
  estimateSolar,
  monthlyKwhPerPanel,
  normalizeToRange,
  type SolarAssumptions,
} from "./solar";

const phoenix: SolarAssumptions = phoenixAz;
const run = (monthlyBill: number, coveragePercent: number) =>
  estimateSolar({ monthlyBill, coveragePercent }, phoenix);

/** Payback as displayed on the page (one decimal). */
const displayedPayback = (years: number) => Number(years.toFixed(1));

describe("estimateSolar — Phoenix, AZ", () => {
  it("produces 70.2 kWh per 450 W panel per month", () => {
    expect(monthlyKwhPerPanel(phoenix)).toBeCloseTo(70.2, 10);
  });

  it("default scenario: $220 bill, 80% coverage", () => {
    const r = run(220, 80);

    expect(r.panels).toBe(17);
    expect(r.requestedPanels).toBe(17);
    expect(r.netInvestment).toBeCloseTo(14726.25, 2);
    expect(r.monthlySavings).toBeCloseTo(179.01, 2);
    expect(r.monthlyGenerationKwh).toBeCloseTo(1193.4, 6);
    expect(displayedPayback(r.paybackYears)).toBe(6.9);
    expect(r.minimumPanelsApplied).toBe(false);
    expect(r.savingsCappedAtBill).toBe(false);
  });

  it("$430 bill at 100% coverage caps savings at the bill", () => {
    const r = run(430, 100);

    expect(r.panels).toBe(41);
    expect(r.netInvestment).toBeCloseTo(35516.25, 2);
    // 41 panels generate $431.73 worth of energy — more than the bill.
    expect(r.uncappedMonthlySavings).toBeCloseTo(431.73, 2);
    expect(r.monthlySavings).toBe(430);
    expect(r.savingsCappedAtBill).toBe(true);
    expect(r.minimumPanelsApplied).toBe(false);
    expect(displayedPayback(r.paybackYears)).toBe(6.9);
  });

  it("$60 bill at 50% coverage applies the 8-panel minimum (and caps savings)", () => {
    const r = run(60, 50);

    expect(r.requestedPanels).toBe(3);
    expect(r.panels).toBe(8);
    expect(r.minimumPanelsApplied).toBe(true);
    expect(r.netInvestment).toBeCloseTo(6930, 2);
    expect(r.monthlySavings).toBe(60);
    expect(r.savingsCappedAtBill).toBe(true);
    expect(displayedPayback(r.paybackYears)).toBe(9.6);
  });

  // Full acceptance table from the specification.
  it.each([
    { bill: 220, coverage: 80, panels: 17, investment: 14726.25, savings: 179.01, payback: 6.9 },
    { bill: 430, coverage: 80, panels: 33, investment: 28586.25, savings: 347.49, payback: 6.9 },
    { bill: 430, coverage: 100, panels: 41, investment: 35516.25, savings: 430.0, payback: 6.9 },
    { bill: 90, coverage: 80, panels: 8, investment: 6930.0, savings: 84.24, payback: 6.9 },
    { bill: 60, coverage: 80, panels: 8, investment: 6930.0, savings: 60.0, payback: 9.6 },
    { bill: 60, coverage: 50, panels: 8, investment: 6930.0, savings: 60.0, payback: 9.6 },
  ])(
    "$$bill at $coverage% → $panels panels, $$investment, $$savings/mo, $payback yrs",
    ({ bill, coverage, panels, investment, savings, payback }) => {
      const r = run(bill, coverage);
      expect(r.panels).toBe(panels);
      expect(r.netInvestment).toBeCloseTo(investment, 2);
      expect(r.monthlySavings).toBeCloseTo(savings, 2);
      expect(displayedPayback(r.paybackYears)).toBe(payback);
    },
  );

  it("always rounds panels up", () => {
    // $220 at 80% needs 16.71 panels of energy → 17, never 16.
    const r = run(220, 80);
    expect(r.consumptionToCoverKwh / r.monthlyKwhPerPanel).toBeCloseTo(16.714, 3);
    expect(r.panels).toBe(17);
  });

  it("does not add a panel when the requirement is an exact integer despite float noise", () => {
    // Mathematically exactly 93 panels, but IEEE-754 yields 93.00000000000001,
    // which a naive Math.ceil would turn into 94.
    const bill = (93 * 10.53 * 100) / 68;
    const r = run(bill, 68);
    expect(r.consumptionToCoverKwh / r.monthlyKwhPerPanel).toBeGreaterThan(93);
    expect(r.requestedPanels).toBe(93);
  });

  it("never includes the state incentive in the investment", () => {
    const r = run(220, 80);
    const gross = r.panels * phoenix.panelWatts * phoenix.costPerWattInstalled;
    expect(r.grossSystemCost).toBeCloseTo(gross, 6);
    expect(r.netInvestment).toBeCloseTo(gross * (1 - phoenix.federalCreditRate), 6);
    expect(r.federalCreditAmount).toBeCloseTo(gross * phoenix.federalCreditRate, 6);
  });

  it("rejects invalid inputs instead of returning NaN", () => {
    expect(() => run(0, 80)).toThrow(RangeError);
    expect(() => run(220, 0)).toThrow(RangeError);
    expect(() => run(220, 120)).toThrow(RangeError);
    expect(() => run(Number.NaN, 80)).toThrow(RangeError);
    expect(() => estimateSolar({ monthlyBill: 220, coveragePercent: 80 }, { ...phoenix, minPanels: 0 })).toThrow(
      RangeError,
    );
  });
});

describe("normalizeToRange", () => {
  it("keeps valid values", () => {
    expect(normalizeToRange("220", BILL_RANGE, 1)).toBe(220);
    expect(normalizeToRange(85, COVERAGE_RANGE, 1)).toBe(85);
  });

  it("clamps and snaps to the step", () => {
    expect(normalizeToRange("9999", BILL_RANGE, 1)).toBe(600);
    expect(normalizeToRange("5", BILL_RANGE, 1)).toBe(40);
    expect(normalizeToRange("224", BILL_RANGE, 1)).toBe(220);
    expect(normalizeToRange("83", COVERAGE_RANGE, 1)).toBe(85);
  });

  it("falls back on garbage", () => {
    expect(normalizeToRange("abc", BILL_RANGE, 220)).toBe(220);
    expect(normalizeToRange(null, BILL_RANGE, 220)).toBe(220);
    expect(normalizeToRange("", COVERAGE_RANGE, 80)).toBe(80);
  });
});
