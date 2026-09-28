/**
 * Tiny, vendor-neutral tracking client (browser only).
 *
 * `track()` builds a fully-attributed event and hands it to every registered
 * transport. Swapping to Segment / PostHog / GA4 means registering a transport;
 * no component changes. See README → Analytics.
 */
import { getSessionUtms } from "./attribution";
import type { AnalyticsEvent, AnalyticsEventName, EventPropertiesMap } from "./events";

export interface AnalyticsTransport {
  name: string;
  send(event: AnalyticsEvent): void;
}

export const ANALYTICS_ENDPOINT = "/api/analytics";

/** Default transport: POST to our own route. sendBeacon survives page unloads. */
const localEndpoint: AnalyticsTransport = {
  name: "local-endpoint",
  send(event) {
    const body = JSON.stringify(event);
    if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
      const queued = navigator.sendBeacon(
        ANALYTICS_ENDPOINT,
        new Blob([body], { type: "application/json" }),
      );
      if (queued) return;
    }
    void fetch(ANALYTICS_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    }).catch(() => undefined);
  },
};

const devConsole: AnalyticsTransport = {
  name: "dev-console",
  send(event) {
    console.info(`[analytics] ${event.event}`, event);
  },
};

const transports: AnalyticsTransport[] =
  process.env.NODE_ENV === "development" ? [localEndpoint, devConsole] : [localEndpoint];

/** Add a vendor transport at runtime, e.g. from a consent-gated loader. */
export function registerTransport(transport: AnalyticsTransport): void {
  if (!transports.some((t) => t.name === transport.name)) transports.push(transport);
}

export function track<N extends AnalyticsEventName>(
  event: N,
  city: string,
  properties: EventPropertiesMap[N],
): void {
  if (typeof window === "undefined") return;

  const payload: AnalyticsEvent<N> = {
    event,
    city,
    path: window.location.pathname,
    ...getSessionUtms(),
    timestamp: new Date().toISOString(),
    properties,
  };

  for (const transport of transports) {
    try {
      transport.send(payload);
    } catch {
      // Analytics must never break the page.
    }
  }
}
