/**
 * Canonical origin used for metadata, the sitemap and structured data.
 * Set NEXT_PUBLIC_SITE_URL in production (see README → Deploy checklist).
 */
function resolveSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit.replace(/\/+$/, "");
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (vercel) return `https://${vercel}`;
  return "http://localhost:3000";
}

export const SITE_URL = resolveSiteUrl();
export const BRAND_NAME = "Brightfield Solar";

export function cityPath(slug: string): string {
  return `/solar/${slug}`;
}

/** "tel:+16025550147" from "(602) 555-0147" (assumes US numbers). */
export function telHref(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  return `tel:+${digits.length === 10 ? `1${digits}` : digits}`;
}
