/**
 * Every number shown on the page goes through these formatters.
 * The locale is pinned to en-US (and dates to UTC) so the server render and
 * the browser render always produce identical strings — no hydration mismatch.
 */
const LOCALE = "en-US";

const usdCents = new Intl.NumberFormat(LOCALE, {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const usdWhole = new Intl.NumberFormat(LOCALE, {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const integer = new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 0 });

const oneDecimal = new Intl.NumberFormat(LOCALE, {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

const upToTwoDecimals = new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 2 });

const monthYear = new Intl.DateTimeFormat(LOCALE, {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

/** $14,726.25 */
export const formatUsd = (value: number): string => usdCents.format(value);

/** $14,726 */
export const formatUsdWhole = (value: number): string => usdWhole.format(value);

/** 1,840 */
export const formatInteger = (value: number): string => integer.format(value);

/** 6.9 */
export const formatOneDecimal = (value: number): string => oneDecimal.format(value);

/** 1,193 kWh */
export const formatKwh = (value: number): string => `${integer.format(value)} kWh`;

/** 7.65 kW */
export const formatKw = (value: number): string => `${upToTwoDecimals.format(value)} kW`;

/** August 2025 — input is an ISO date (YYYY-MM-DD). */
export const formatMonthYear = (isoDate: string): string =>
  monthYear.format(new Date(`${isoDate}T00:00:00Z`));
