import type { NextConfig } from "next";

/**
 * CSP is intentionally practical for Next.js on Cloudflare. Everything is served from
 * this site's own origin; no third-party script, frame or connect host is allowed.
 */
const isProduction = process.env.NODE_ENV === "production";

/** Everything comes from this site; eval is only allowed for the dev server's hot reload. */
function contentSecurityPolicy(frameAncestors: "'none'" | "'self'") {
  return [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    `frame-ancestors ${frameAncestors}`,
    "form-action 'self'",
    "img-src 'self' data: blob:",
    "font-src 'self' data:",
    "style-src 'self' 'unsafe-inline'",
    `script-src 'self' 'unsafe-inline'${isProduction ? "" : " 'unsafe-eval'"}`,
    "connect-src 'self'",
    // The documents desk previews papers from this site in a frame; nothing else is framed.
    "frame-src 'self'",
    "worker-src 'self' blob:",
    "manifest-src 'self'",
    "upgrade-insecure-requests",
  ].join("; ");
}

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()",
  },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "X-Permitted-Cross-Domain-Policies", value: "none" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "Content-Security-Policy", value: contentSecurityPolicy("'none'") },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async redirects() {
    // One canonical address: www and the old workers.dev address both → nazareneforshe.org.
    // The home page gets its own rule: on Cloudflare an empty `:path*` was sent out literally.
    const oldHosts = ["www.nazareneforshe.org", "nazarene-for-she.christophererick.workers.dev"];
    return oldHosts.flatMap((value) => {
      const has = [{ type: "host" as const, value }];
      return [
        { source: "/", has, destination: "https://nazareneforshe.org/", permanent: true },
        { source: "/:path+", has, destination: "https://nazareneforshe.org/:path+", permanent: true },
      ];
    });
  },
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 31536000,
    qualities: [75, 80, 85, 90],
  },
  async headers() {
    const isDev = process.env.NODE_ENV !== "production";
    return [
      {
        source: "/(.*)",
        headers: isDev
          ? [
              ...securityHeaders,
              { key: "Cache-Control", value: "no-store, must-revalidate" },
            ]
          : securityHeaders,
      },
      {
        // A paper's file is shown inside the documents desk (same site), so it alone may be framed by us.
        source: "/api/v1/admin/documents/:id/file",
        headers: [
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Content-Security-Policy", value: contentSecurityPolicy("'self'") },
        ],
      },
      {
        source: "/images/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: isDev
              ? "no-store, must-revalidate"
              : "public, max-age=31536000, immutable",
          },
        ],
      },
      ...(!isDev
        ? [
            {
              source: "/_next/static/:path*",
              headers: [
                {
                  key: "Cache-Control",
                  value: "public, max-age=31536000, immutable",
                },
              ],
            },
          ]
        : []),
      {
        source: "/api/v1/admin/:path*",
        headers: [
          { key: "Cache-Control", value: "no-store, max-age=0" },
          { key: "Pragma", value: "no-cache" },
        ],
      },
      {
        source: "/api/shop",
        headers: [
          { key: "Cache-Control", value: "no-store, max-age=0" },
          { key: "Pragma", value: "no-cache" },
        ],
      },
      {
        source: "/api/shop/:path*",
        headers: [
          { key: "Cache-Control", value: "no-store, max-age=0" },
          { key: "Pragma", value: "no-cache" },
        ],
      },
      {
        source: "/api/contact",
        headers: [
          { key: "Cache-Control", value: "no-store, max-age=0" },
          { key: "Pragma", value: "no-cache" },
        ],
      },
      {
        source: "/api/donation",
        headers: [
          { key: "Cache-Control", value: "no-store, max-age=0" },
          { key: "Pragma", value: "no-cache" },
        ],
      },
    ];
  },
};

export default nextConfig;

import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
if (process.env.NODE_ENV === "development") {
  initOpenNextCloudflareForDev();
}
