import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/site-url';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // The dashboard and the JSON endpoints behind it. Neither is a page
      // anyone should reach from a search result; the API routes enforce the
      // session themselves, so this is tidiness rather than a control.
      disallow: ['/admin', '/api/'],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
