import type { NextConfig } from "next";

// Security headers, applied to every route. This is an internal university
// tool (no third-party embeds, no external scripts/styles loaded by the
// browser), so the CSP can stay strict — 'self' plus 'unsafe-inline' only
// for styles (Tailwind's runtime + inline style attributes use this).
//
// 'unsafe-eval' in script-src is only added in development: React's dev
// mode uses eval() for better stack traces/hot-reload (Turbopack's dev
// runtime does too), and without it every page throws a CSP console error
// in `next dev` even though the app still mostly works. Production builds
// (what Vercel actually serves) never need eval(), so the deployed app
// keeps the stricter policy.
const isDev = process.env.NODE_ENV !== "production";

const securityHeaders = [
  // Never let this app be framed by another site (clickjacking defense) —
  // there's no legitimate reason to embed a login-gated marks portal in
  // an iframe.
  { key: "X-Frame-Options", value: "DENY" },
  // Stop browsers from guessing content types away from what the server
  // declares (mitigates some XSS/MIME-confusion attacks).
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Don't leak the full referring URL (which could contain a project ID
  // or similar) to an external site when a link is clicked.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // This app doesn't use the camera, microphone, or geolocation — say so
  // explicitly rather than leaving the default (which allows same-origin).
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
  // Defense-in-depth alongside robots.txt: some crawlers ignore
  // robots.txt but respect this header.
  { key: "X-Robots-Tag", value: "noindex, nofollow" },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      // Next.js needs 'unsafe-inline' for its own inline bootstrap script;
      // there are no third-party scripts anywhere in this app.
      `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
      // Tailwind's arbitrary-value utilities and a few inline style props
      // rely on inline styles.
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data:",
      "font-src 'self' data:",
      // Server Functions/Route Handlers are same-origin; no external API
      // calls happen from the browser.
      "connect-src 'self'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
