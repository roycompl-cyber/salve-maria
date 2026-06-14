import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "polskakatolicka.org" },
      { protocol: "https", hostname: "www.polskakatolicka.org" },
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
          {
            key: "Content-Security-Policy",
            value: "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; font-src 'self' data:; connect-src 'self' https://*.supabase.co wss://*.supabase.co https://polskakatolicka.org https://www.polskakatolicka.org; media-src 'self'; frame-src https://www.youtube.com https://youtube.com; frame-ancestors 'self'; base-uri 'self'; form-action 'self' https://polskakatolicka.org https://www.polskakatolicka.org; object-src 'none'",
          },
        ],
      },
      {
        source: "/api/admin/:path*",
        headers: [{ key: "Cache-Control", value: "no-store" }],
      },
      ...[
        "/api/contact",
        "/api/push/:path*",
        "/api/track",
        "/api/errors",
        "/api/announcements",
        "/api/cron/:path*",
        "/api/proxy",
        "/api/petitions/prefill",
        "/api/petitions/donation-prefill",
      ].map((source) => ({
        source,
        headers: [{ key: "Cache-Control", value: "no-store" }],
      })),
    ];
  },
};

export default nextConfig;
