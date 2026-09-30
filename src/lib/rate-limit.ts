/**
 * Fixed-window, in-memory rate limiter.
 *
 * Best-effort only: state lives in one server instance, so on serverless
 * (Vercel) each warm instance counts separately and cold starts reset it. It
 * stops a single client from flooding the endpoint; for a hard guarantee swap
 * `hit()` for a shared store (Upstash Redis, Vercel KV, the WAF's rate rules).
 */
export interface RateLimiter {
  /** Records one request for `key`; returns whether it is allowed. */
  hit(key: string, now?: number): { allowed: boolean; retryAfterSeconds: number };
}

export function createRateLimiter({ limit, windowMs }: { limit: number; windowMs: number }): RateLimiter {
  const windows = new Map<string, { start: number; count: number }>();

  return {
    hit(key, now = Date.now()) {
      // Drop expired windows so the map cannot grow without bound.
      for (const [k, w] of windows) {
        if (now - w.start >= windowMs) windows.delete(k);
      }

      const current = windows.get(key);
      if (!current) {
        windows.set(key, { start: now, count: 1 });
        return { allowed: true, retryAfterSeconds: 0 };
      }

      current.count += 1;
      if (current.count > limit) {
        return { allowed: false, retryAfterSeconds: Math.max(1, Math.ceil((current.start + windowMs - now) / 1000)) };
      }
      return { allowed: true, retryAfterSeconds: 0 };
    },
  };
}

/** Best-effort client identifier behind a proxy (Vercel sets x-forwarded-for). */
export function clientKey(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || request.headers.get("x-real-ip") || "unknown";
}
