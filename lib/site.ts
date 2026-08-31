import { cache } from 'react';
import { migrate, type SiteContent } from './content';
import { getStore } from './store';

/**
 * The site record, for server components.
 *
 * `cache` dedupes this within a single render, so a page and the layout chrome
 * that both need it hit storage once. migrate() runs on every read so
 * newly-shipped defaults appear without ever overwriting owner content.
 */
export const getSiteContent = cache(async (): Promise<SiteContent> => {
  const stored = await getStore().getSite();
  return migrate(stored);
});
