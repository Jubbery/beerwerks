/**
 * A fixed-window rate limiter.
 *
 * IN-MEMORY, AND THAT IS A LIMITATION: on Vercel each serverless instance gets
 * its own map, so the effective limit is (instances × limit) and a cold start
 * resets it. It raises the cost of casual abuse and nothing more.
 *
 * Phase 6 must replace this with a shared store — Upstash Redis, or a small
 * Postgres table — before the public endpoints are live in front of real
 * traffic. Tracked in docs/PLAN.md.
 */
type Window = { count: number; resetAt: number };

const windows = new Map<string, Window>();

/** Bound the map so a flood of unique keys cannot grow it without limit. */
const MAX_KEYS = 10_000;

export function rateLimit(
  key: string,
  { limit, windowMs }: { limit: number; windowMs: number },
): { ok: boolean; retryAfterSeconds: number } {
  const now = Date.now();
  const existing = windows.get(key);

  if (!existing || now >= existing.resetAt) {
    if (windows.size >= MAX_KEYS) {
      for (const [k, w] of windows) if (now >= w.resetAt) windows.delete(k);
      if (windows.size >= MAX_KEYS) windows.clear();
    }
    windows.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfterSeconds: 0 };
  }

  existing.count += 1;
  if (existing.count > limit) {
    return { ok: false, retryAfterSeconds: Math.ceil((existing.resetAt - now) / 1000) };
  }
  return { ok: true, retryAfterSeconds: 0 };
}

/** Best-effort client address. Trusts Vercel's proxy headers. */
export function clientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return request.headers.get('x-real-ip') ?? 'unknown';
}
