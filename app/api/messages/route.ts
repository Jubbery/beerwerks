import { NextResponse } from 'next/server';
import { getStore } from '@/lib/store';
import { isOwner } from '@/lib/auth';
import { messagesSchema } from '@/lib/validation';

/** GET /api/messages — owner only. Contact submissions are private. */
export async function GET() {
  if (!(await isOwner())) {
    return NextResponse.json({ error: 'Not signed in.' }, { status: 401 });
  }
  return NextResponse.json(await getStore().listMessages());
}

/** PATCH /api/messages — owner only. Replaces the list (read flags, deletes). */
export async function PATCH(request: Request) {
  if (!(await isOwner())) {
    return NextResponse.json({ error: 'Not signed in.' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Could not read that request.' }, { status: 400 });
  }

  const parsed = messagesSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'That did not look right.' }, { status: 400 });
  }

  try {
    await getStore().putMessages(parsed.data);
  } catch (error) {
    console.error('[messages] could not save', error);
    return NextResponse.json({ error: 'Could not save. Try again.' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
