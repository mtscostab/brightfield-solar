import { describe, expect, it } from "vitest";
import { parseUtms } from "./attribution";
import { isAnalyticsEvent } from "./events";

describe("parseUtms", () => {
  it("reads the three campaign parameters", () => {
    expect(parseUtms("?utm_source=google&utm_medium=cpc&utm_campaign=phx_solar&gclid=x")).toEqual({
      utm_source: "google",
      utm_medium: "cpc",
      utm_campaign: "phx_solar",
    });
  });

  it("returns nulls when absent or blank", () => {
    expect(parseUtms("?bill=220&utm_source=")).toEqual({
      utm_source: null,
      utm_medium: null,
      utm_campaign: null,
    });
  });
});

describe("isAnalyticsEvent", () => {
  const valid = {
    event: "cta_clicked",
    city: "phoenix-az",
    path: "/solar/phoenix-az",
    utm_source: "google",
    utm_medium: null,
    utm_campaign: null,
    timestamp: "2026-01-01T00:00:00.000Z",
    properties: { cta: "hero_primary", location: "hero", href: "#estimate" },
  };

  it("accepts a well-formed event", () => {
    expect(isAnalyticsEvent(valid)).toBe(true);
  });

  it("rejects unknown events and missing attribution", () => {
    expect(isAnalyticsEvent({ ...valid, event: "page_hacked" })).toBe(false);
    expect(isAnalyticsEvent({ ...valid, city: undefined })).toBe(false);
    expect(isAnalyticsEvent({ ...valid, properties: { nested: { a: 1 } } })).toBe(false);
  });
});
