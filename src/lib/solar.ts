/**
 * Solar savings estimate — pure, framework-free and deterministic.
 *
 * Nothing in this file knows about React, the DOM or a specific city. It takes
 * the user's inputs plus a set of city assumptions and returns every
 * intermediate value, so the UI can both display the result and "show the math".
 */

/** City-level assumptions the calculation depends on. */
export interface SolarAssumptions {
  /** Utility energy price, USD per kWh. */
  utilityRatePerKwh: number;
  /** Average peak-sun hours per day. */
  peakSunHoursPerDay: number;
  /** Nameplate rating of one panel, in watts. */
  panelWatts: number;
  /** Real-world derate (inverter, wiring, heat, soiling). 0–1. */
  performanceRatio: number;
  /** Installed cost, USD per watt, before incentives. */
  costPerWattInstalled: number;
  /** Smallest installation the local team will build. */
  minPanels: number;
  /** Federal tax credit as a fraction of system cost. 0–1. */
  federalCreditRate: number;
}

export interface SolarInputs {
  /** Average monthly electricity bill, USD. */
  monthlyBill: number;
  /** Share of monthly consumption the system should cover, in percent (e.g. 80). */
  coveragePercent: number;
}

export interface SolarEstimate {
  // Inputs, echoed back for convenience.
  monthlyBill: number;
  coveragePercent: number;

  // Intermediate values (useful for "show the math" and debugging).
  monthlyConsumptionKwh: number;
  consumptionToCoverKwh: number;
  monthlyKwhPerPanel: number;
  requestedPanels: number;
  grossSystemCost: number;
  federalCreditAmount: number;
  uncappedMonthlySavings: number;

  // Headline results.
  panels: number;
  systemSizeKw: number;
  netInvestment: number;
  monthlyGenerationKwh: number;
  monthlySavings: number;
  annualSavings: number;
  paybackYears: number;

  // Transparency flags the UI must surface.
  minimumPanelsApplied: boolean;
  savingsCappedAtBill: boolean;
}

/** Days per month used by the model (a flat 30, by specification). */
export const DAYS_PER_MONTH = 30;

/**
 * Floating-point guard for Math.ceil. `x / y` can land a hair above an exact
 * integer (e.g. 17.000000000000004), which would wrongly add a whole panel.
 */
const CEIL_EPSILON = 1e-9;
const safeCeil = (value: number): number => Math.ceil(value - CEIL_EPSILON);

function assertPositive(name: string, value: number): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new RangeError(`${name} must be a positive, finite number (received ${value}).`);
  }
}

function assertFraction(name: string, value: number): void {
  if (!Number.isFinite(value) || value < 0 || value > 1) {
    throw new RangeError(`${name} must be between 0 and 1 (received ${value}).`);
  }
}

/** Monthly energy produced by one panel, in kWh. */
export function monthlyKwhPerPanel(
  a: Pick<SolarAssumptions, "panelWatts" | "peakSunHoursPerDay" | "performanceRatio">,
): number {
  return (a.panelWatts / 1000) * a.peakSunHoursPerDay * DAYS_PER_MONTH * a.performanceRatio;
}

/**
 * Estimate panel count, cost after the federal credit, monthly savings and
 * payback. The order of operations follows the product specification exactly;
 * see README → "The formula".
 *
 * State incentives are deliberately NOT part of this function.
 */
export function estimateSolar(inputs: SolarInputs, a: SolarAssumptions): SolarEstimate {
  const { monthlyBill, coveragePercent } = inputs;

  assertPositive("monthlyBill", monthlyBill);
  assertPositive("coveragePercent", coveragePercent);
  if (coveragePercent > 100) {
    throw new RangeError(`coveragePercent must be at most 100 (received ${coveragePercent}).`);
  }
  assertPositive("utilityRatePerKwh", a.utilityRatePerKwh);
  assertPositive("peakSunHoursPerDay", a.peakSunHoursPerDay);
  assertPositive("panelWatts", a.panelWatts);
  assertPositive("costPerWattInstalled", a.costPerWattInstalled);
  assertFraction("performanceRatio", a.performanceRatio);
  assertFraction("federalCreditRate", a.federalCreditRate);
  if (!Number.isInteger(a.minPanels) || a.minPanels < 1) {
    throw new RangeError(`minPanels must be a positive integer (received ${a.minPanels}).`);
  }

  // 1. How much energy the household uses today.
  const monthlyConsumptionKwh = monthlyBill / a.utilityRatePerKwh;

  // 2. How much of it the system should offset.
  const consumptionToCoverKwh = monthlyConsumptionKwh * (coveragePercent / 100);

  // 3. What one panel produces in a month.
  const perPanel = monthlyKwhPerPanel(a);

  // 4. Panels always round UP — never under-size the system.
  const requestedPanels = safeCeil(consumptionToCoverKwh / perPanel);

  // 5. Enforce the minimum installation size.
  const panels = Math.max(requestedPanels, a.minPanels);
  const minimumPanelsApplied = panels > requestedPanels;

  // 6. Cost after the federal credit (state incentives are informational only).
  const grossSystemCost = panels * a.panelWatts * a.costPerWattInstalled;
  const netInvestment = grossSystemCost * (1 - a.federalCreditRate);
  const federalCreditAmount = grossSystemCost - netInvestment;

  // 7. What the full system generates.
  const monthlyGenerationKwh = panels * perPanel;

  // 8. Savings can never exceed the bill: surplus becomes utility credit, not cash.
  const uncappedMonthlySavings = monthlyGenerationKwh * a.utilityRatePerKwh;
  const monthlySavings = Math.min(uncappedMonthlySavings, monthlyBill);
  const savingsCappedAtBill = uncappedMonthlySavings > monthlyBill;

  // 9. Simple payback: no rate escalation, no degradation, no financing.
  const annualSavings = monthlySavings * 12;
  const paybackYears = netInvestment / annualSavings;

  return {
    monthlyBill,
    coveragePercent,
    monthlyConsumptionKwh,
    consumptionToCoverKwh,
    monthlyKwhPerPanel: perPanel,
    requestedPanels,
    grossSystemCost,
    federalCreditAmount,
    uncappedMonthlySavings,
    panels,
    systemSizeKw: (panels * a.panelWatts) / 1000,
    netInvestment,
    monthlyGenerationKwh,
    monthlySavings,
    annualSavings,
    paybackYears,
    minimumPanelsApplied,
    savingsCappedAtBill,
  };
}

/* -------------------------------------------------------------------------- */
/* Simulator input domain                                                      */
/* -------------------------------------------------------------------------- */

export interface RangeSpec {
  min: number;
  max: number;
  step: number;
}

/** Input ranges are a product decision shared by every city page. */
export const BILL_RANGE: RangeSpec = { min: 40, max: 600, step: 10 };
export const COVERAGE_RANGE: RangeSpec = { min: 50, max: 100, step: 5 };

/**
 * Clamp a value into a range and snap it to the nearest step. Returns
 * `fallback` for anything that is not a finite number. Used to sanitise
 * values coming from the URL (?bill=…&coverage=…).
 */
export function normalizeToRange(value: unknown, range: RangeSpec, fallback: number): number {
  const n = typeof value === "string" && value.trim() !== "" ? Number(value) : value;
  if (typeof n !== "number" || !Number.isFinite(n)) return fallback;
  const clamped = Math.min(range.max, Math.max(range.min, n));
  const snapped = range.min + Math.round((clamped - range.min) / range.step) * range.step;
  return Math.min(range.max, snapped);
}
