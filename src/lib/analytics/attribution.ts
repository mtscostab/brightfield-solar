/**
 * Campaign attribution (browser only).
 *
 * UTMs are read from the landing URL and kept in sessionStorage, so they are
 * still attached to events after the visitor scrolls, edits the simulator
 * (which rewrites the query string) or reloads the page.
 */

export const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign"] as const;
export type UtmKey = (typeof UTM_KEYS)[number];
export type Utms = Record<UtmKey, string | null>;

const STORAGE_KEY = "bf:utm";
const MAX_LENGTH = 200;

const EMPTY: Utms = { utm_source: null, utm_medium: null, utm_campaign: null };

/** Pure: extract UTMs from a query string. */
export function parseUtms(search: string): Utms {
  const params = new URLSearchParams(search);
  const out: Utms = { ...EMPTY };
  for (const key of UTM_KEYS) {
    const value = params.get(key)?.trim();
    out[key] = value ? value.slice(0, MAX_LENGTH) : null;
  }
  return out;
}

const hasAny = (u: Utms): boolean => UTM_KEYS.some((k) => u[k] !== null);

function readStored(): Utms | null {
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return null;
    const p = parsed as Record<string, unknown>;
    const out: Utms = { ...EMPTY };
    for (const key of UTM_KEYS) out[key] = typeof p[key] === "string" ? (p[key] as string) : null;
    return out;
  } catch {
    return null; // Storage blocked (private mode, disabled cookies…): degrade silently.
  }
}

/**
 * UTMs for the current session. A URL that carries UTMs wins (last touch)
 * and is persisted; otherwise the stored value is used.
 */
export function getSessionUtms(): Utms {
  if (typeof window === "undefined") return { ...EMPTY };
  const fromUrl = parseUtms(window.location.search);
  if (hasAny(fromUrl)) {
    try {
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(fromUrl));
    } catch {
      /* ignore */
    }
    return fromUrl;
  }
  return readStored() ?? { ...EMPTY };
}
