import 'server-only';
import { Pool } from 'pg';

/**
 * Postgres connection and schema.
 *
 * node-postgres over Neon's POOLED connection string (the host containing
 * `-pooler`). Neon's pooler is PgBouncer, which is what makes a per-invocation
 * connection safe from a serverless function; `max: 1` keeps each instance to
 * a single client so a burst of invocations cannot exhaust the pool.
 */

let pool: Pool | null = null;

function isLocal(connectionString: string): boolean {
  try {
    const { hostname } = new URL(connectionString);
    return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1';
  } catch {
    return false;
  }
}

export function db(): Pool {
  if (pool) return pool;

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error('DATABASE_URL is not set.');

  pool = new Pool({
    connectionString,
    max: 1,
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 10_000,
    // Neon presents a certificate from a public CA, so the system trust store
    // verifies it. rejectUnauthorized is set explicitly and stays true: a
    // connection string carries the database password, and silently accepting
    // any certificate would expose it to interception. Local development over
    // a loopback socket has no TLS to verify.
    ssl: isLocal(connectionString) ? false : { rejectUnauthorized: true },
  });

  // A pool error on an idle client would otherwise be an unhandled rejection
  // and take the process down.
  pool.on('error', (error) => console.error('[db] idle client error', error));

  return pool;
}

/**
 * Create the schema if it is not there.
 *
 * Deliberately idempotent and run lazily on first use rather than as a
 * separate deploy step: there is no DBA here, and a migration command someone
 * has to remember is a migration command that eventually gets skipped. The
 * promise is cached so concurrent callers share one attempt.
 */
let migrated: Promise<void> | null = null;

export function ensureSchema(): Promise<void> {
  if (migrated) return migrated;

  migrated = (async () => {
    await db().query(`
      CREATE TABLE IF NOT EXISTS site_content (
        id         text PRIMARY KEY,
        content    jsonb NOT NULL,
        updated_at timestamptz NOT NULL DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS contact_messages (
        id          text PRIMARY KEY,
        name        text NOT NULL,
        email       text NOT NULL,
        phone       text NOT NULL,
        topic       text NOT NULL,
        message     text NOT NULL,
        received_at timestamptz NOT NULL,
        read        boolean NOT NULL DEFAULT false
      );

      CREATE INDEX IF NOT EXISTS contact_messages_received_at_idx
        ON contact_messages (received_at DESC);

      CREATE TABLE IF NOT EXISTS rate_limits (
        key      text PRIMARY KEY,
        count    integer NOT NULL,
        reset_at timestamptz NOT NULL
      );
    `);
  })().catch((error) => {
    // Do not cache a failed attempt — the next request should retry rather
    // than inherit a permanently rejected promise.
    migrated = null;
    throw error;
  });

  return migrated;
}
