import type { NextConfig } from "next";

import "./src/env";
import { securityHeaders } from "./src/lib/security-headers";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  cacheComponents: true,
  poweredByHeader: false,
  // `pnpm dev` only: let phones on the local network (http://192.168.x.x:3000) load dev assets,
  // otherwise the page never hydrates. Ignored by production builds.
  allowedDevOrigins: ["192.168.*.*", "10.*.*.*"],
  images: {
    remotePatterns: [{ protocol: "https", hostname: "res.cloudinary.com" }],
  },
  // D-14 category-kind routing for the fixed non-SERVICE slugs, answered before rendering
  // (a redirect thrown during a streamed render sends a duplicated Location header).
  async redirects() {
    return [
      { source: "/services/buy-sell", destination: "/buy-sell", permanent: true },
      { source: "/services/property", destination: "/property", permanent: true },
      { source: "/services/custom-request", destination: "/request/custom", permanent: true },
      { source: "/services/ambulance", destination: "/emergency/ambulance", permanent: true },
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders(process.env.NODE_ENV === "development"),
      },
    ];
  },
};

export default nextConfig;
