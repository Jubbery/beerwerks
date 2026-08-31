import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { ContactMessage, SiteContent } from './content';

/**
 * Persistence boundary. Everything that touches storage goes through this, so
 * the backing store is a swappable decision.
 *
 * Production is Neon Postgres (one JSONB `site_content` row + a
 * `contact_messages` table). Local development uses a JSON file so the site
 * runs with no database and no network.
 */
export interface Store {
  getSite(): Promise<SiteContent | null>;
  putSite(content: SiteContent): Promise<void>;
  listMessages(): Promise<ContactMessage[]>;
  putMessages(messages: ContactMessage[]): Promise<void>;
  addMessage(message: ContactMessage): Promise<void>;
}

/* ── Development adapter ──────────────────────────────────────────────────
   A JSON file under .data/. NOT shippable: Vercel's filesystem is read-only,
   so in production every owner edit would appear to save and then vanish.
   The selector below makes that impossible rather than merely documented.
   ──────────────────────────────────────────────────────────────────────── */

const DATA_DIR = path.join(process.cwd(), '.data');
const SITE_FILE = path.join(DATA_DIR, 'site.json');
const MESSAGES_FILE = path.join(DATA_DIR, 'messages.json');

async function readJson<T>(file: string, fallback: T): Promise<T> {
  try {
    return JSON.parse(await fs.readFile(file, 'utf8')) as T;
  } catch {
    return fallback;
  }
}

async function writeJson(file: string, value: unknown): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  // Write-then-rename, so an interrupted write cannot truncate the owners'
  // content to half a file.
  const tmp = `${file}.${process.pid}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(value, null, 2), 'utf8');
  await fs.rename(tmp, file);
}

export const fileStore: Store = {
  getSite: () => readJson<SiteContent | null>(SITE_FILE, null),
  putSite: (content) => writeJson(SITE_FILE, content),
  listMessages: () => readJson<ContactMessage[]>(MESSAGES_FILE, []),
  putMessages: (messages) => writeJson(MESSAGES_FILE, messages),
  async addMessage(message) {
    const list = await readJson<ContactMessage[]>(MESSAGES_FILE, []);
    await writeJson(MESSAGES_FILE, [message, ...list]);
  },
};

/* ── Selection ───────────────────────────────────────────────────────────── */

let cached: Store | null = null;

/**
 * The active store.
 *
 * In production a DATABASE_URL is required. Falling back to the file adapter
 * there would silently discard every owner edit, so this throws instead — a
 * failed deploy is recoverable, lost content is not.
 *
 * ALLOW_FILE_STORE is the one deliberate escape hatch, for verifying a
 * production build locally or in CI where no database exists. It is an
 * explicit opt-in and must never be set on the real deployment.
 */
export function getStore(): Store {
  if (cached) return cached;

  const isProduction = process.env.NODE_ENV === 'production';
  const hasDatabase = Boolean(process.env.DATABASE_URL);
  const fileStoreAllowed = process.env.ALLOW_FILE_STORE === '1';

  if (isProduction && !hasDatabase && !fileStoreAllowed) {
    throw new Error(
      'DATABASE_URL is not set. The file store cannot be used in production — ' +
        'the filesystem is read-only there, so owner edits would be lost. ' +
        'Set ALLOW_FILE_STORE=1 only to verify a build locally or in CI.',
    );
  }

  if (hasDatabase) {
    // Guard against a half-migration: a DATABASE_URL that is configured but
    // ignored would look like it is working while writing to a file that
    // vanishes on the next deploy.
    throw new Error(
      'DATABASE_URL is set but the Postgres adapter is not implemented yet ' +
        '(planned for phase 6). Refusing to fall back to the file store.',
    );
  }

  cached = fileStore;
  return cached;
}
