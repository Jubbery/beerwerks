/**
 * The site's own absolute base URL.
 *
 * Link previews, the sitemap and robots.txt all need absolute URLs, and the
 * app has no way to know its own origin at build time. The order below means
 * the site works on its Vercel URL today and switches to the real domain by
 * setting one environment variable — no code change at cutover.
 *
 *   1. NEXT_PUBLIC_SITE_URL   set this to https://flowershopbeerwerks.com
 *                             once DNS points at Vercel.
 *   2. VERCEL_PROJECT_PRODUCTION_URL   the project's stable production
 *                             hostname, injected by Vercel. Deliberately not
 *                             VERCEL_URL, which is unique per deployment and
 *                             would put a throwaway hostname in the sitemap.
 *   3. localhost              development.
 */
function resolve(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) return explicit.replace(/\/$/, '');

  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (vercel) return `https://${vercel}`;

  return 'http://localhost:3000';
}

export const SITE_URL = resolve();
