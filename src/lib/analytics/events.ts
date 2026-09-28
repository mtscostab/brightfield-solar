/**
 * Analytics event contract, shared by the browser client and /api/analytics.
 * Vendor-neutral on purpose: the shape maps 1:1 onto Segment `track`,
 * PostHog `capture` and GA4 `gtag('event')` calls.
 */

export type Primitive = string | number | boolean | null;

/** Properties carried by each event, keyed by event name. */
export interface EventPropertiesMap {
  simulation_updated: {
    monthly_bill: number;
    coverage_percent: number;
    panels: number;
    net_investment: number;
    monthly_savings: number;
    payback_years: number;
    minimum_panels_applied: boolean;
    savings_capped: boolean;
    /** What the user touched last: "bill", "coverage" or "profile". */
    input: string;
  };
  cta_clicked: {
    /** Stable CTA identifier, e.g. "hero_primary". */
    cta: string;
    /** Page region the CTA lives in, e.g. "hero", "final_cta". */
    location: string;
    href: string | null;
  };
}

export type AnalyticsEventName = keyof EventPropertiesMap;

export const ANALYTICS_EVENT_NAMES = [
  "simulation_updated",
  "cta_clicked",
] as const satisfies readonly AnalyticsEventName[];

/** Attribution fields required on every event. */
export interface AttributionContext {
  city: string;
  path: string;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
}

export interface AnalyticsEvent<N extends AnalyticsEventName = AnalyticsEventName>
  extends AttributionContext {
  event: N;
  /** ISO-8601 timestamp from the browser. */
  timestamp: string;
  properties: EventPropertiesMap[N];
}

const isNullableString = (v: unknown): v is string | null => v === null || typeof v === "string";

function isPrimitive(v: unknown): v is Primitive {
  return v === null || ["string", "number", "boolean"].includes(typeof v);
}

/** Runtime guard for payloads arriving at the API route. */
export function isAnalyticsEvent(value: unknown): value is AnalyticsEvent {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.event === "string" &&
    (ANALYTICS_EVENT_NAMES as readonly string[]).includes(v.event) &&
    typeof v.city === "string" &&
    typeof v.path === "string" &&
    typeof v.timestamp === "string" &&
    isNullableString(v.utm_source) &&
    isNullableString(v.utm_medium) &&
    isNullableString(v.utm_campaign) &&
    typeof v.properties === "object" &&
    v.properties !== null &&
    Object.values(v.properties).every(isPrimitive)
  );
}
