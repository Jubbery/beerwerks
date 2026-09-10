import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Content-Security-Policy.
 *
 * This is the only place the CSP is set. It used to live in next.config.ts,
 * but a nonce has to be minted per request, and two sources setting the same
 * header would leave the browser enforcing the intersection of both.
 *
 * Next injects its RSC payload as inline <script> tags, so a policy of
 * `script-src 'self'` blocks the framework's own bootstrap and the page dies
 * during hydration (React error #412). There are two ways to allow them, and
 * this file uses a different one per route, deliberately:
 *
 *   /admin      A per-request nonce, plus 'strict-dynamic'. Next reads the
 *               nonce out of this header and stamps it onto its own scripts.
 *               A nonce only works on a DYNAMICALLY rendered page — a
 *               prerendered one was built before any request existed — and
 *               /admin is already dynamic because it reads the session
 *               cookie, so this costs nothing. It is also the surface worth
 *               protecting: the owner session and every write live here.
 *
 *   everything  'unsafe-inline'. The public pages are statically prerendered,
 *   else       which is what keeps them fast and cacheable at the edge, and a
 *              nonce would force them all to render per request. The trade is
 *              acceptable because those pages have no injection vector: every
 *              value is rendered as React text, there is no
 *              dangerouslySetInnerHTML anywhere in the app, and no
 *              third-party script is loaded. The rest of the policy still
 *              applies — origins, framing, form targets and base URI.
 *
 * If a third-party script or any raw-HTML rendering is ever added to a public
 * page, revisit this: that is the change that makes 'unsafe-inline' unsafe.
 */

const isDev = process.env.NODE_ENV === 'development';

function policy(scriptSrc: string): string {
  return [
    "default-src 'self'",
    scriptSrc,
    // Inline style ATTRIBUTES (style={{…}}, and Leaflet's marker) are blocked
    // by style-src without this. Style injection is a far smaller risk than
    // script injection, and Next and Leaflet both rely on it.
    "style-src 'self' 'unsafe-inline'",
    // OSM serves tiles from the bare host as well as subdomains.
    "img-src 'self' data: blob: https://tile.openstreetmap.org https://*.tile.openstreetmap.org",
    "font-src 'self'",
    "connect-src 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    'upgrade-insecure-requests',
  ].join('; ');
}

export function proxy(request: NextRequest) {
  const isAdmin = request.nextUrl.pathname.startsWith('/admin');

  if (!isAdmin) {
    const response = NextResponse.next();
    response.headers.set(
      'Content-Security-Policy',
      // 'unsafe-eval' in development only: React uses eval to rebuild
      // server-side error stacks in the browser. Production needs neither.
      policy(`script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''}`),
    );
    return response;
  }

  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');
  const csp = policy(
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ''}`,
  );

  // Next reads the nonce back out of the request's CSP header while rendering
  // and applies it to its own script tags, so nothing here needs stamping by
  // hand.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);
  requestHeaders.set('Content-Security-Policy', csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set('Content-Security-Policy', csp);
  return response;
}

export const config = {
  matcher: [
    // Skip static assets and image optimization, which need no policy, and
    // prefetch requests, which are not documents.
    {
      source: '/((?!_next/static|_next/image|favicon.ico|icon.png).*)',
      missing: [{ type: 'header', key: 'next-router-prefetch' }],
    },
  ],
};
