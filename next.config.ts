import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
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
