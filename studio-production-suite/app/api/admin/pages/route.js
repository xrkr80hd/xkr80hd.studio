import { NextResponse } from 'next/server';
import { ADMIN_SESSION_COOKIE, ADMIN_SESSION_USER_COOKIE, isAdminSessionValid, isOwnerUsername, getAdminSessionUser } from '../../../../lib/admin-auth';
import { getPageVisibilityDb, isKnownPageKey, PAGE_VISIBILITY_TABLE, readPageVisibility } from '../../../../lib/page-visibility';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function isOwner(request) {
  return (
    isAdminSessionValid(request.cookies.get(ADMIN_SESSION_COOKIE)?.value || '') &&
    isOwnerUsername(getAdminSessionUser(request.cookies.get(ADMIN_SESSION_COOKIE)?.value) || '')
  );
}

export async function GET(request) {
  if (!isOwner(request)) return NextResponse.json({ error: 'Only owner can change page switches.' }, { status: 403 });
  const visibility = await readPageVisibility();
  return NextResponse.json(visibility);
}

export async function PATCH(request) {
  if (!isOwner(request)) return NextResponse.json({ error: 'Only owner can change page switches.' }, { status: 403 });
  const body = await request.json().catch(() => ({}));
  const key = String(body?.key || '');
  if (!isKnownPageKey(key) || typeof body?.enabled !== 'boolean') {
    return NextResponse.json({ error: 'Unknown page or bad value.' }, { status: 400 });
  }
  const db = getPageVisibilityDb();
  if (!db) return NextResponse.json({ error: 'Database is not configured.' }, { status: 500 });
  const { error } = await db
    .from(PAGE_VISIBILITY_TABLE)
    .upsert({ page_key: key, enabled: body.enabled, updated_at: new Date().toISOString() }, { onConflict: 'page_key' });
  if (error) {
    return NextResponse.json({ error: 'Could not save. Run the page switches SQL in Supabase first.', needsSetup: true }, { status: 500 });
  }
  return NextResponse.json({ ok: true, key, enabled: body.enabled });
}
