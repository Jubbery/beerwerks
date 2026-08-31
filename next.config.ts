import type { NextConfig } from 'next';

/**
 * Security headers. The CSP is deliberately explicit about the two external
 * origins the site actually reaches: OpenStreetMap tiles for the Location map,
 * and nothing else — Archivo is self-hosted by next/font at build time.
 */
const securityHeaders = [
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "img-src 'self' data: blob: https://*.tile.openstreetmap.org",
      "style-src 'self' 'unsafe-inline'",
      "script-src 'self'" + (process.env.NODE_ENV === 'development' ? " 'unsafe-eval' 'unsafe-inline'" : ''),
      "font-src 'self'",
      "connect-src 'self'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; '),
  },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
};

export default nextConfig;
