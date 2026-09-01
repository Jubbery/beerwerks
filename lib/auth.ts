import 'server-only';
import { cache } from 'react';
import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';
import { verify } from '@node-rs/argon2';

/**
 * Owner authentication.
 *
 * Two owners share one credential, which is proportionate here. What matters
 * is that none of the prototype's demo auth survives: the password is never in
 * the source or in plaintext env, the session is signed and HTTP-only, and
 * every write verifies it on the server rather than trusting a client flag.
 */

const COOKIE = 'fsbw_session';
const SESSION_DAYS = 30;

/** Long enough that the owners are not signing in constantly. */
const MAX_AGE_SECONDS = SESSION_DAYS * 24 * 60 * 60;

type SessionPayload = { owner: true };

function secret(): Uint8Array {
  const value = process.env.SESSION_SECRET;
  // Refuse to run rather than fall back to a default: a predictable signing
  // key means anyone can mint a valid owner session.
  if (!value || value.length < 32) {
    throw new Error(
      'SESSION_SECRET is missing or too short (needs 32+ characters). ' +
        'Generate one with `openssl rand -base64 32`.',
    );
  }
  return new TextEncoder().encode(value);
}

async function encrypt(payload: SessionPayload): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(secret());
}

async function decrypt(token: string | undefined): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret(), { algorithms: ['HS256'] });
    return payload.owner === true ? { owner: true } : null;
  } catch {
    // Expired, tampered with, or signed by a rotated secret. All the same
    // outcome: no session.
    return null;
  }
}

/**
 * Whether the current request carries a valid owner session.
 *
 * `cache` dedupes it within a render so the admin page and anything it renders
 * verify once. This is the real check — call it before serving or writing
 * anything owner-only, not a flag passed down from the client.
 */
export const isOwner = cache(async (): Promise<boolean> => {
  const token = (await cookies()).get(COOKIE)?.value;
  return (await decrypt(token)) !== null;
});

export async function createSession(): Promise<void> {
  const token = await encrypt({ owner: true });
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    // Off on localhost only — a Secure cookie is never sent over plain HTTP,
    // so leaving it on would break local development entirely.
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function destroySession(): Promise<void> {
  (await cookies()).delete(COOKIE);
}

/**
 * Check a submitted password against the stored argon2id hash.
 *
 * Returns false rather than throwing on a malformed hash, so a
 * misconfiguration reads as "wrong password" to the caller and is logged for
 * whoever has to fix it.
 */
export async function verifyOwnerPassword(password: string): Promise<boolean> {
  const hash = process.env.OWNER_PASSWORD_HASH;

  if (!hash) {
    console.error('[auth] OWNER_PASSWORD_HASH is not set — nobody can sign in.');
    return false;
  }

  // An argon2 hash always begins '$argon2'. If it does not, the value has been
  // mangled in transit — almost always by a .env file, because dotenv expands
  // `$...` as a variable reference and an argon2 hash is full of them, even
  // inside single quotes. The result is a hash silently chewed down to
  // fragments, and a login that fails with "that password does not match"
  // while the password is perfectly correct. Name the cause rather than let
  // someone lose an afternoon to it.
  if (!hash.startsWith('$argon2')) {
    console.error(
      '[auth] OWNER_PASSWORD_HASH is not a valid argon2 hash — it should start ' +
        `with "$argon2" but starts with "${hash.slice(0, 8)}". In a .env file every ` +
        'dollar sign must be escaped as \\$, or the value gets expanded away. ' +
        '`npm run hash-password` prints a correctly escaped line to paste.',
    );
    return false;
  }

  try {
    return await verify(hash, password);
  } catch (error) {
    console.error('[auth] could not verify against OWNER_PASSWORD_HASH', error);
    return false;
  }
}
