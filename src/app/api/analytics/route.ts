import { isAnalyticsEvent } from "@/lib/analytics/events";
import { clientKey, createRateLimiter } from "@/lib/rate-limit";

/**
 * Local analytics sink. It validates and logs events, nothing more — a stand-in
 * for a real collector (Segment, PostHog, GA4 Measurement Protocol, a queue…).
 */
const MAX_BODY_BYTES = 8 * 1024;

// 60 events/minute per client: generous for real use (simulator events are
// debounced to one per adjustment), tight enough to blunt a flood.
const limiter = createRateLimiter({ limit: 60, windowMs: 60_000 });

export async function POST(request: Request): Promise<Response> {
  const { allowed, retryAfterSeconds } = limiter.hit(clientKey(request));
  if (!allowed) {
    return Response.json(
      { error: "Too many requests" },
      { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } },
    );
  }

  const raw = await request.text();
  if (raw.length > MAX_BODY_BYTES) {
    return Response.json({ error: "Payload too large" }, { status: 413 });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(raw);
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!isAnalyticsEvent(payload)) {
    return Response.json({ error: "Invalid analytics event" }, { status: 422 });
  }

  // Structured, single-line log: easy to grep locally and to ship to a log drain.
  console.info(JSON.stringify({ type: "analytics", receivedAt: new Date().toISOString(), ...payload }));

  return new Response(null, { status: 202 });
}
