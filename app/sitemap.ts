import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/site-url';

/**
 * The public pages, and only those. /admin is excluded deliberately — it is
 * also noindex, but a sitemap is a published list of what to crawl and the
 * owner dashboard has no business on it.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const updated = new Date();

  return [
    { url: `${SITE_URL}/`, lastModified: updated, changeFrequency: 'weekly', priority: 1 },
    { url: `${SITE_URL}/menu`, lastModified: updated, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${SITE_URL}/events`, lastModified: updated, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${SITE_URL}/location`, lastModified: updated, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${SITE_URL}/about`, lastModified: updated, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${SITE_URL}/contact`, lastModified: updated, changeFrequency: 'monthly', priority: 0.6 },
  ];
}
