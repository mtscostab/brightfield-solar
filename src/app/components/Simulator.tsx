"use client";

import { AlertTriangle, ArrowDown, ArrowRight, Info, Layers } from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState, useSyncExternalStore, type CSSProperties } from "react";
import type { CityContent } from "@/content/cities";
import { track } from "@/lib/analytics/client";
import { formatInteger, formatKw, formatKwh, formatOneDecimal, formatUsd, formatUsdWhole } from "@/lib/format";
import {
  BILL_RANGE,
  COVERAGE_RANGE,
  estimateSolar,
  normalizeToRange,
  type RangeSpec,
  type SolarAssumptions,
} from "@/lib/solar";
import { ShareButton } from "./ShareButton";
import styles from "./Simulator.module.css";

/** Only the serialisable slice of city data the simulator needs. */
export type SimulatorCity = SolarAssumptions &
  Pick<
    CityContent,
    "slug" | "city" | "utilityName" | "stateIncentiveNote" | "householdProfiles" | "simulatorDefaults"
  >;

type InputSource = "bill" | "coverage" | "profile";

const URL_SYNC_DELAY_MS = 250;
const ANALYTICS_DELAY_MS = 800;
const ANNOUNCE_DELAY_MS = 600;

/* -------------------------------------------------------------------------- */
/* Initial state from the URL — hydration-safe                                 */
/* -------------------------------------------------------------------------- */

// The landing query string is read once per path and never changes afterwards,
// so later history.replaceState() calls cannot remount the form mid-drag.
let landing: { path: string; search: string } | null = null;
const noopSubscribe = () => () => {};
const getLandingSearch = () => {
  if (!landing || landing.path !== window.location.pathname) {
    landing = { path: window.location.pathname, search: window.location.search };
  }
  return landing.search;
};
/** On the server and during hydration there is no URL: render the defaults. */
const getServerSearch = () => null;

function initialValues(search: string | null, city: SimulatorCity) {
  const params = new URLSearchParams(search ?? "");
  return {
    bill: normalizeToRange(params.get("bill"), BILL_RANGE, city.simulatorDefaults.monthlyBill),
    coverage: normalizeToRange(params.get("coverage"), COVERAGE_RANGE, city.simulatorDefaults.coveragePercent),
  };
}

/**
 * Public component. A shared link such as `?bill=310&coverage=90` must open
 * with those values, but the server can't see the query string of a static
 * page. We render the defaults on the server, then — right after hydration —
 * remount the form with the URL values (only if they differ).
 */
export function Simulator({ city }: { city: SimulatorCity }) {
  const search = useSyncExternalStore(noopSubscribe, getLandingSearch, getServerSearch);
  const initial = initialValues(search, city);
  return <SimulatorForm key={`${initial.bill}-${initial.coverage}`} city={city} initial={initial} />;
}

/* -------------------------------------------------------------------------- */
/* Form                                                                        */
/* -------------------------------------------------------------------------- */

function fillPercent(value: number, range: RangeSpec): string {
  return `${((value - range.min) / (range.max - range.min)) * 100}%`;
}

function useDebounced<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

function SimulatorForm({ city, initial }: { city: SimulatorCity; initial: { bill: number; coverage: number } }) {
  const [bill, setBill] = useState(initial.bill);
  const [coverage, setCoverage] = useState(initial.coverage);
  const lastInput = useRef<InputSource | null>(null);
  const id = useId();

  // All maths lives in the pure function; the component only renders it.
  const r = useMemo(() => estimateSolar({ monthlyBill: bill, coveragePercent: coverage }, city), [bill, coverage, city]);

  const update = (source: InputSource, next: { bill?: number; coverage?: number }) => {
    lastInput.current = source;
    if (next.bill !== undefined) setBill(next.bill);
    if (next.coverage !== undefined) setCoverage(next.coverage);
  };

  // Keep the address bar in sync, so the page URL *is* the shareable estimate.
  // UTM and any other parameters are preserved untouched.
  useEffect(() => {
    if (!lastInput.current) return;
    const t = window.setTimeout(() => {
      const url = new URL(window.location.href);
      url.searchParams.set("bill", String(bill));
      url.searchParams.set("coverage", String(coverage));
      window.history.replaceState(window.history.state, "", url);
    }, URL_SYNC_DELAY_MS);
    return () => window.clearTimeout(t);
  }, [bill, coverage]);

  // One analytics event per settled change, not one per slider tick.
  useEffect(() => {
    const input = lastInput.current;
    if (!input) return;
    const t = window.setTimeout(() => {
      track("simulation_updated", city.slug, {
        monthly_bill: r.monthlyBill,
        coverage_percent: r.coveragePercent,
        panels: r.panels,
        net_investment: Math.round(r.netInvestment * 100) / 100,
        monthly_savings: Math.round(r.monthlySavings * 100) / 100,
        payback_years: Math.round(r.paybackYears * 10) / 10,
        minimum_panels_applied: r.minimumPanelsApplied,
        savings_capped: r.savingsCappedAtBill,
        input,
      });
    }, ANALYTICS_DELAY_MS);
    return () => window.clearTimeout(t);
  }, [r, city.slug]);

  const summary =
    `Estimate for a ${formatUsdWhole(bill)} bill at ${coverage}% coverage: ` +
    `${r.panels} panels, ${formatUsd(r.netInvestment)} after the federal credit, ` +
    `${formatUsd(r.monthlySavings)} saved per month, payback in ${formatOneDecimal(r.paybackYears)} years.` +
    (r.minimumPanelsApplied ? ` Minimum ${city.minPanels}-panel installation applied.` : "") +
    (r.savingsCappedAtBill ? " Savings are capped at your bill." : "");
  const announcement = useDebounced(summary, ANNOUNCE_DELAY_MS);

  const billId = `${id}-bill`;
  const coverageId = `${id}-coverage`;
  const coveredShare = Math.round((r.monthlySavings / r.monthlyBill) * 100);
  const creditPct = Math.round(city.federalCreditRate * 100);

  return (
    <div className={styles.layout}>
      {/* ------------------------------ Inputs ------------------------------ */}
      <form className={styles.inputs} onSubmit={(e) => e.preventDefault()} aria-labelledby={`${id}-inputs-title`}>
        <h3 id={`${id}-inputs-title`} className={styles.panelTitle}>
          Your home
        </h3>

        <fieldset className={styles.profiles}>
          <legend className={styles.label}>Start from a typical {city.city} home</legend>
          <div className={styles.profileGrid}>
            {city.householdProfiles.map((p) => (
              <label key={p.label} className={styles.profile}>
                <input
                  type="radio"
                  name={`${id}-profile`}
                  value={p.typicalBill}
                  checked={bill === p.typicalBill}
                  onChange={() => update("profile", { bill: p.typicalBill })}
                />
                <span className={styles.profileText}>{p.label}</span>
                <span className={styles.profileBill}>
                  ~{formatUsdWhole(p.typicalBill)}
                  <span className="visually-hidden"> per month</span>
                </span>
              </label>
            ))}
          </div>
          <p className={styles.hint}>Picking a home fills in its typical bill. Fine-tune it with the slider.</p>
        </fieldset>

        <div className={styles.field}>
          <div className={styles.fieldHead}>
            <label htmlFor={billId} className={styles.label}>
              Average monthly electric bill
            </label>
            <output htmlFor={billId} className={styles.value}>
              {formatUsdWhole(bill)}
            </output>
          </div>
          <input
            id={billId}
            className={styles.range}
            type="range"
            min={BILL_RANGE.min}
            max={BILL_RANGE.max}
            step={BILL_RANGE.step}
            value={bill}
            aria-valuetext={`${formatUsdWhole(bill)} per month`}
            aria-describedby={`${billId}-hint`}
            style={{ "--fill": fillPercent(bill, BILL_RANGE) } as CSSProperties}
            onChange={(e) => update("bill", { bill: Number(e.currentTarget.value) })}
          />
          <p id={`${billId}-hint`} className={styles.scale}>
            <span>{formatUsdWhole(BILL_RANGE.min)}</span>
            <span>Your {city.utilityName} bill, averaged over a year</span>
            <span>{formatUsdWhole(BILL_RANGE.max)}</span>
          </p>
        </div>

        <div className={styles.field}>
          <div className={styles.fieldHead}>
            <label htmlFor={coverageId} className={styles.label}>
              How much of your usage to cover
            </label>
            <output htmlFor={coverageId} className={styles.value}>
              {coverage}%
            </output>
          </div>
          <input
            id={coverageId}
            className={styles.range}
            type="range"
            min={COVERAGE_RANGE.min}
            max={COVERAGE_RANGE.max}
            step={COVERAGE_RANGE.step}
            value={coverage}
            aria-valuetext={`${coverage} percent`}
            aria-describedby={`${coverageId}-hint`}
            style={{ "--fill": fillPercent(coverage, COVERAGE_RANGE) } as CSSProperties}
            onChange={(e) => update("coverage", { coverage: Number(e.currentTarget.value) })}
          />
          <p id={`${coverageId}-hint`} className={styles.scale}>
            <span>{COVERAGE_RANGE.min}%</span>
            <span>Less than 100% keeps the system smaller</span>
            <span>{COVERAGE_RANGE.max}%</span>
          </p>
        </div>
        {/* Phones stack results below the inputs: keep the headline numbers in view. */}
        <a href="#estimate-results" className={styles.peek}>
          <span>
            <strong>{formatUsd(r.monthlySavings)}</strong> a month · {r.panels} panels
          </span>
          <span className={styles.peekLink}>
            Full estimate <ArrowDown size={16} aria-hidden="true" />
          </span>
        </a>

        {/* Informational only: the state incentive never enters the calculation. */}
        <p className={styles.stateNote}>
          <Info size={18} aria-hidden="true" />
          <span>
            <strong>State incentive:</strong> {city.stateIncentiveNote}
          </span>
        </p>
      </form>

      {/* ------------------------------ Results ----------------------------- */}
      <section
        id="estimate-results"
        className={`${styles.results} on-dark`}
        data-tilt="3"
        aria-labelledby={`${id}-results-title`}>
        <h3 id={`${id}-results-title`} className={styles.resultsTitle}>
          Your {city.city} estimate
        </h3>

        {/* Screen readers get one calm summary after the user stops adjusting. */}
        <p className="visually-hidden" role="status" aria-live="polite" aria-atomic="true">
          {announcement}
        </p>

        <div className={styles.headline}>
          <p className={styles.headlineLabel} id={`${id}-savings`}>
            Estimated monthly savings
          </p>
          <output className={styles.headlineValue} aria-labelledby={`${id}-savings`}>
            {/* Re-keyed so each new value lands with a small bump. */}
            <span key={r.monthlySavings} className={styles.tick}>
              {formatUsd(r.monthlySavings)}
            </span>
          </output>
          <div className={styles.meter} aria-hidden="true">
            <span style={{ width: `${Math.min(100, coveredShare)}%` }} />
          </div>
          <p className={styles.meterText}>
            Covers {coveredShare}% of your {formatUsdWhole(r.monthlyBill)} monthly bill
          </p>
        </div>

        <dl className={styles.metrics}>
          <div className={styles.metric}>
            <dt>Solar panels</dt>
            <dd>
              <output>
                <span key={r.panels} className={styles.tick}>
                  {formatInteger(r.panels)}
                </span>
              </output>
              <span className={styles.metricSub}>
                {formatKw(r.systemSizeKw)} system · {city.panelWatts} W each
              </span>
            </dd>
          </div>
          <div className={styles.metric}>
            <dt>Investment after {creditPct}% federal credit</dt>
            <dd>
              <output>{formatUsd(r.netInvestment)}</output>
              <span className={styles.metricSub}>{formatUsd(r.grossSystemCost)} before the credit</span>
            </dd>
          </div>
          <div className={styles.metric}>
            <dt>Payback</dt>
            <dd>
              <output>{formatOneDecimal(r.paybackYears)} years</output>
              <span className={styles.metricSub}>{formatUsd(r.annualSavings)} saved per year</span>
            </dd>
          </div>
          <div className={styles.metric}>
            <dt>Monthly generation</dt>
            <dd>
              <output>{formatKwh(r.monthlyGenerationKwh)}</output>
              <span className={styles.metricSub}>You use about {formatKwh(r.monthlyConsumptionKwh)}</span>
            </dd>
          </div>
        </dl>

        {(r.minimumPanelsApplied || r.savingsCappedAtBill) && (
          <ul className={styles.notices}>
            {r.minimumPanelsApplied && (
              <li className={styles.notice}>
                <Layers size={20} aria-hidden="true" />
                <p>
                  <strong>Minimum {city.minPanels}-panel installation applied.</strong> Your requested coverage needs{" "}
                  {r.requestedPanels === 1 ? "1 panel" : `${r.requestedPanels} panels`}, but {city.minPanels} is the
                  smallest safe installation our local team can complete.
                </p>
              </li>
            )}
            {r.savingsCappedAtBill && (
              <li className={styles.notice}>
                <AlertTriangle size={20} aria-hidden="true" />
                <p>
                  <strong>Savings are capped at your bill.</strong> The system could produce{" "}
                  {formatUsd(r.uncappedMonthlySavings)} of energy a month, but extra solar generation becomes utility
                  credit; it does not become cash back.
                </p>
              </li>
            )}
          </ul>
        )}

        <details className={styles.math}>
          <summary>Show the math</summary>
          <ol>
            <li>
              {formatUsd(r.monthlyBill)} ÷ {formatUsd(city.utilityRatePerKwh)}/kWh ={" "}
              <b>{formatKwh(r.monthlyConsumptionKwh)}</b> used per month
            </li>
            <li>
              × {r.coveragePercent}% coverage = <b>{formatKwh(r.consumptionToCoverKwh)}</b> to cover
            </li>
            <li>
              One panel: {city.panelWatts / 1000} kW × {city.peakSunHoursPerDay} sun hours × 30 days ×{" "}
              {city.performanceRatio} performance = <b>{formatOneDecimal(r.monthlyKwhPerPanel)} kWh</b>
            </li>
            <li>
              {formatInteger(r.consumptionToCoverKwh)} ÷ {formatOneDecimal(r.monthlyKwhPerPanel)}, rounded up ={" "}
              <b>{r.requestedPanels} panels</b>
              {r.minimumPanelsApplied ? `, raised to the ${city.minPanels}-panel minimum` : ""}
            </li>
            <li>
              {r.panels} × {city.panelWatts} W × {formatUsd(city.costPerWattInstalled)}/W ={" "}
              {formatUsd(r.grossSystemCost)}, minus {creditPct}% = <b>{formatUsd(r.netInvestment)}</b>
            </li>
            <li>
              {formatKwh(r.monthlyGenerationKwh)} × {formatUsd(city.utilityRatePerKwh)} ={" "}
              {formatUsd(r.uncappedMonthlySavings)}
              {r.savingsCappedAtBill ? `, capped at your ${formatUsd(r.monthlyBill)} bill` : ""} ={" "}
              <b>{formatUsd(r.monthlySavings)}</b> a month
            </li>
            <li>
              {formatUsd(r.netInvestment)} ÷ ({formatUsd(r.monthlySavings)} × 12) ={" "}
              <b>{formatOneDecimal(r.paybackYears)} years</b>
            </li>
          </ol>
          <p>
            Assumes today&rsquo;s {city.utilityName} rate stays flat, no panel degradation and a cash purchase. Your
            written quote uses your roof and your real usage history.
          </p>
        </details>

        <div className={styles.resultActions}>
          <a href="#quote" className="btn btn-cta" data-cta="simulator_crew_lead" data-cta-location="simulator">
            Talk to a crew lead
            <ArrowRight size={18} aria-hidden="true" />
          </a>
          <ShareButton cta="simulator_share" location="simulator" city={city.city} variant="light" />
        </div>
      </section>
    </div>
  );
}
