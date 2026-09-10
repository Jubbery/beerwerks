import { NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import type { ContactMessage } from '@/lib/content';
import { getStore } from '@/lib/store';
import { clientIp, rateLimit } from '@/lib/ratelimit';
import { contactSchema } from '@/lib/validation';
import { sendContactNotification } from '@/lib/mail';

/** Public and unauthenticated, so it is validated and rate-limited. */
export async function POST(request: Request) {
  const limit = await rateLimit(`contact:${clientIp(request)}`, { limit: 5, windowMs: 10 * 60 * 1000 });
  if (!limit.ok) {
    return NextResponse.json(
      { error: 'That is a lot of messages. Give it a few minutes and try again.' },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfterSeconds) } },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Could not read that request.' }, { status: 400 });
  }

  const parsed = contactSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Some of those details need another look.' }, { status: 400 });
  }

  // Honeypot: a real person never sees this field. Answer 200 so a bot cannot
  // tell it was caught and start probing for what gets through.
  if (parsed.data.website) {
    return NextResponse.json({ ok: true });
  }

  const message: ContactMessage = {
    id: randomUUID(),
    name: parsed.data.name,
    email: parsed.data.email,
    // An em dash so the dashboard shows "email · —" rather than a dangling
    // separator when no phone was given.
    phone: parsed.data.phone || '—',
    topic: parsed.data.topic,
    message: parsed.data.message,
    receivedAt: new Date().toISOString(),
    read: false,
  };

  // Persist first. If mail fails afterwards the message is still safe and the
  // owners will see it in the dashboard — losing it would be the real failure.
  try {
    await getStore().addMessage(message);
  } catch (error) {
    console.error('[contact] could not persist message', error);
    return NextResponse.json(
      { error: 'Something went wrong on our end. Please email us directly.' },
      { status: 500 },
    );
  }

  // Non-fatal by construction: the message is already stored, so a mail
  // failure is logged and the sender still gets a success.
  await sendContactNotification(message);

  return NextResponse.json({ ok: true });
}
