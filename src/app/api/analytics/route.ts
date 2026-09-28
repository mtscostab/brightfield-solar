import { isAnalyticsEvent } from "@/lib/analytics/events";

/**
 * Local analytics sink. It validates and logs events, nothing more — a stand-in
 * for a real collector (Segment, PostHog, GA4 Measurement Protocol, a queue…).
 */
const MAX_BODY_BYTES = 8 * 1024;

export async function POST(request: Request): Promise<Response> {
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
