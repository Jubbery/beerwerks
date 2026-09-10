import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { ContactMessage, SiteContent } from './content';
import { db, ensureSchema } from './db';

/**
 * Persistence boundary. Everything that touches storage goes through this, so
 * the backing store is a swappable decision.
 *
 * Production is Neon Postgres. Local development uses a JSON file so the site
 * runs with no database and no network.
 */
export interface Store {
  getSite(): Promise<SiteContent | null>;
  putSite(content: SiteContent): Promise<void>;
  listMessages(): Promise<ContactMessage[]>;
  addMessage(message: ContactMessage): Promise<void>;
  /**
   * Delete one message by id.
   *
   * Deliberately per-message rather than "replace the whole list": with
   * whole-list replacement, a message arriving while the dashboard was open
   * would be wiped out the moment an owner deleted some older one. A customer
   * enquiry is exactly the thing that must not vanish.
   */
  deleteMessage(id: string): Promise<void>;
}

/** The site record is a single row. */
const SITE_ID = 'singleton';

/* ── Postgres adapter (production) ───────────────────────────────────────── */

export const pgStore: Store = {
  async getSite() {
    await ensureSchema();
    const { rows } = await db().query<{ content: SiteContent }>(
      'SELECT content FROM site_content WHERE id = $1',
      [SITE_ID],
    );
    return rows[0]?.content ?? null;
  },

  async putSite(content) {
    await ensureSchema();
    await db().query(
      `INSERT INTO site_content (id, content, updated_at)
       VALUES ($1, $2, now())
       ON CONFLICT (id) DO UPDATE SET content = EXCLUDED.content, updated_at = now()`,
      [SITE_ID, JSON.stringify(content)],
    );
  },

  async listMessages() {
    await ensureSchema();
    const { rows } = await db().query<{
      id: string;
      name: string;
      email: string;
      phone: string;
      topic: string;
      message: string;
      received_at: Date;
      read: boolean;
    }>(
      `SELECT id, name, email, phone, topic, message, received_at, read
       FROM contact_messages ORDER BY received_at DESC`,
    );
    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      email: row.email,
      phone: row.phone,
      topic: row.topic,
      message: row.message,
      receivedAt: row.received_at.toISOString(),
      read: row.read,
    }));
  },

  async addMessage(message) {
    await ensureSchema();
    await db().query(
      `INSERT INTO contact_messages (id, name, email, phone, topic, message, received_at, read)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (id) DO NOTHING`,
      [
        message.id,
        message.name,
        message.email,
        message.phone,
        message.topic,
        message.message,
        message.receivedAt,
        message.read,
      ],
    );
  },

  async deleteMessage(id) {
    await ensureSchema();
    await db().query('DELETE FROM contact_messages WHERE id = $1', [id]);
  },
};

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
  async addMessage(message) {
    const list = await readJson<ContactMessage[]>(MESSAGES_FILE, []);
    await writeJson(MESSAGES_FILE, [message, ...list]);
  },
  async deleteMessage(id) {
    const list = await readJson<ContactMessage[]>(MESSAGES_FILE, []);
    await writeJson(
      MESSAGES_FILE,
      list.filter((m) => m.id !== id),
    );
  },
};

/* ── Selection ───────────────────────────────────────────────────────────── */

let cached: Store | null = null;

/**
 * The active store.
 *
 * DATABASE_URL selects Postgres. Without it, production would fall back to a
 * file on a read-only filesystem and silently discard every owner edit, so
 * this throws instead — a failed deploy is recoverable, lost content is not.
 *
 * ALLOW_FILE_STORE is the one deliberate escape hatch, for verifying a
 * production build locally or in CI where no database exists.
 */
export function getStore(): Store {
  if (cached) return cached;

  const hasDatabase = Boolean(process.env.DATABASE_URL);
  if (hasDatabase) {
    cached = pgStore;
    return cached;
  }

  const isProduction = process.env.NODE_ENV === 'production';
  if (isProduction && process.env.ALLOW_FILE_STORE !== '1') {
    throw new Error(
      'DATABASE_URL is not set. The file store cannot be used in production — ' +
        'the filesystem is read-only there, so owner edits would be lost. ' +
        'Set ALLOW_FILE_STORE=1 only to verify a build locally or in CI.',
    );
  }

  cached = fileStore;
  return cached;
}
