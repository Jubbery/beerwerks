import 'server-only';
import { db, ensureSchema } from './db';

/**
 * A fixed-window rate limiter.
 *
 * Backed by Postgres so the window is shared across serverless instances. An
 * in-memory map would give each instance its own counter and reset on every
 * cold start, making the effective limit (instances × limit) — which is not a
 * limit at all in front of the login route.
 *
 * Postgres rather than Redis deliberately: the traffic here is a handful of
 * requests a day, the database already exists, and one fewer hosted service is
 * one fewer account for the owners to hold and pay for.
 */

const memory = new Map<string, { count: number; resetAt: number }>();
const MAX_MEMORY_KEYS = 10_000;

export type RateLimitResult = { ok: boolean; retryAfterSeconds: number };

/**
 * In-memory fallback, used only when no database is configured (local dev).
 */
function memoryLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const existing = memory.get(key);

  if (!existing || now >= existing.resetAt) {
    if (memory.size >= MAX_MEMORY_KEYS) {
      for (const [k, w] of memory) if (now >= w.resetAt) memory.delete(k);
      if (memory.size >= MAX_MEMORY_KEYS) memory.clear();
    }
    memory.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfterSeconds: 0 };
  }

  existing.count += 1;
  if (existing.count > limit) {
    return { ok: false, retryAfterSeconds: Math.ceil((existing.resetAt - now) / 1000) };
  }
  return { ok: true, retryAfterSeconds: 0 };
}

export async function rateLimit(
  key: string,
  { limit, windowMs }: { limit: number; windowMs: number },
): Promise<RateLimitResult> {
  if (!process.env.DATABASE_URL) return memoryLimit(key, limit, windowMs);

  try {
    await ensureSchema();

    // One statement, so concurrent requests cannot interleave a read and a
    // write and both conclude they are under the limit. An expired window is
    // restarted in the same upsert.
    const { rows } = await db().query<{ count: number; reset_at: Date }>(
      `INSERT INTO rate_limits (key, count, reset_at)
       VALUES ($1, 1, now() + ($2::bigint * interval '1 millisecond'))
       ON CONFLICT (key) DO UPDATE SET
         count = CASE WHEN rate_limits.reset_at <= now() THEN 1
                      ELSE rate_limits.count + 1 END,
         reset_at = CASE WHEN rate_limits.reset_at <= now()
                         THEN now() + ($2::bigint * interval '1 millisecond')
                         ELSE rate_limits.reset_at END
       RETURNING count, reset_at`,
      [key, windowMs],
    );

    const row = rows[0];
    if (!row) return { ok: true, retryAfterSeconds: 0 };

    if (row.count > limit) {
      const retry = Math.max(1, Math.ceil((row.reset_at.getTime() - Date.now()) / 1000));
      return { ok: false, retryAfterSeconds: retry };
    }
    return { ok: true, retryAfterSeconds: 0 };
  } catch (error) {
    // Fail open rather than locking the owners out of their own dashboard or
    // refusing every enquiry because the limiter's table is unreachable. The
    // password and the validation are the actual controls; this only raises
    // the cost of abuse.
    console.error('[ratelimit] falling back to in-memory', error);
    return memoryLimit(key, limit, windowMs);
  }
}

/** Best-effort client address. Trusts Vercel's proxy headers. */
export function clientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return request.headers.get('x-real-ip') ?? 'unknown';
}
