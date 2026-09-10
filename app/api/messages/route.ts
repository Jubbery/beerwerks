import { NextResponse } from 'next/server';
import { getStore } from '@/lib/store';
import { isOwner } from '@/lib/auth';

/** GET /api/messages — owner only. Contact submissions are private. */
export async function GET() {
  if (!(await isOwner())) {
    return NextResponse.json({ error: 'Not signed in.' }, { status: 401 });
  }
  return NextResponse.json(await getStore().listMessages());
}

/**
 * DELETE /api/messages?id=… — owner only.
 *
 * One message at a time, rather than replacing the whole list. Whole-list
 * replacement would destroy any message that arrived while the dashboard was
 * open, which is exactly the enquiry the owners would most want to keep.
 */
export async function DELETE(request: Request) {
  if (!(await isOwner())) {
    return NextResponse.json({ error: 'Not signed in.' }, { status: 401 });
  }

  const id = new URL(request.url).searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'Which message?' }, { status: 400 });
  }

  try {
    await getStore().deleteMessage(id);
  } catch (error) {
    console.error('[messages] could not delete', error);
    return NextResponse.json({ error: 'Could not delete. Try again.' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
