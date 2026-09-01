import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { migrate } from '@/lib/content';
import { getStore } from '@/lib/store';
import { isOwner } from '@/lib/auth';
import { siteContentSchema } from '@/lib/validation';

/** GET /api/site — public. */
export async function GET() {
  const content = migrate(await getStore().getSite());
  return NextResponse.json(content);
}

/** PUT /api/site — owner only. */
export async function PUT(request: Request) {
  if (!(await isOwner())) {
    return NextResponse.json({ error: 'Not signed in.' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Could not read that request.' }, { status: 400 });
  }

  const parsed = siteContentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'That content did not look right, so nothing was saved.' },
      { status: 400 },
    );
  }

  try {
    await getStore().putSite(parsed.data);
  } catch (error) {
    console.error('[site] could not save content', error);
    return NextResponse.json(
      { error: 'Could not save. Your changes are still here — try again.' },
      { status: 500 },
    );
  }

  // The root layout reads the site record (announcement bar, footer hours), so
  // invalidating it as a layout cascades to every public page. Without this the
  // owners would save, see no change, and reasonably assume it was broken.
  revalidatePath('/', 'layout');

  return NextResponse.json({ ok: true });
}
