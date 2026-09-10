import { NextResponse } from 'next/server';
import { createSession, verifyOwnerPassword } from '@/lib/auth';
import { clientIp, rateLimit } from '@/lib/ratelimit';

/**
 * POST /api/auth/login
 *
 * Unauthenticated and guarding the only credential on the site, so it is rate
 * limited hard. Every failure returns the same message: distinguishing "no
 * such password" from anything else hands an attacker information.
 */
export async function POST(request: Request) {
  const limit = await rateLimit(`login:${clientIp(request)}`, { limit: 8, windowMs: 15 * 60 * 1000 });
  if (!limit.ok) {
    return NextResponse.json(
      { error: 'Too many attempts. Wait a few minutes and try again.' },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfterSeconds) } },
    );
  }

  let password = '';
  try {
    const body = await request.json();
    if (typeof body?.password === 'string') password = body.password;
  } catch {
    // Falls through to the same generic failure below.
  }

  if (!password || !(await verifyOwnerPassword(password))) {
    return NextResponse.json({ error: 'That password does not match.' }, { status: 401 });
  }

  // The password was right, so any failure past this point is configuration,
  // not the owner. Saying "that password does not match" here would send them
  // hunting for a typo that does not exist.
  try {
    await createSession();
  } catch (error) {
    console.error('[auth] could not create a session', error);
    return NextResponse.json(
      {
        error:
          'That password is right, but the site is not set up to sign you in. ' +
          'Whoever configured the site needs to check SESSION_SECRET.',
      },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
