import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

// The pages are static (SSG), so a per-request nonce is off the table: it would
// force dynamic rendering. Next.js's inline bootstrap/RSC scripts therefore need
// 'unsafe-inline'; everything else stays locked to same-origin. To tighten it,
// move to a nonce-based CSP in proxy.ts and accept dynamic rendering.
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  ...(isDev ? [] : ["upgrade-insecure-requests"]),
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  { key: "X-Frame-Options", value: "DENY" },
  ...(isDev ? [] : [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" }]),
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  async redirects() {
    return [
      {
        // "/" is not a landing page yet. A temporary (307) redirect keeps the
        // door open for a future city index, and Next.js forwards the query
        // string, so ad-click UTMs survive the hop.
        source: "/",
        destination: "/solar/phoenix-az",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
