import { NextResponse } from 'next/server';
import { getProgressDb, progressOwner, sameOrigin } from '../../../../../lib/progress';
import { normalizeEmail } from '../../../../../lib/progress-family.mjs';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  if (!progressOwner(request)) return NextResponse.json({ error: 'Owner access required.' }, { status: 403 });
  const db = getProgressDb();
  if (!db) return NextResponse.json({ error: 'Storage unavailable.' }, { status: 503 });
  const { data, error } = await db.from('progress_members').select('email, name, verified_at, last_seen_at, blocked, created_at').order('created_at', { ascending: false }).limit(500);
  return error ? NextResponse.json({ error: 'Could not load family list.' }, { status: 503 }) : NextResponse.json({ items: data || [] });
}

// Block or unblock a member. Blocking ends their access on the next page load.
export async function PATCH(request) {
  if (!progressOwner(request) || !sameOrigin(request)) return NextResponse.json({ error: 'Owner access required.' }, { status: 403 });
  const raw = await request.json().catch(() => ({}));
  const email = normalizeEmail(raw.email);
  if (!email || typeof raw.blocked !== 'boolean') return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  const db = getProgressDb();
  if (!db) return NextResponse.json({ error: 'Storage unavailable.' }, { status: 503 });
  const { error } = await db.from('progress_members').update({ blocked: raw.blocked }).eq('email', email);
  return error ? NextResponse.json({ error: 'Could not update.' }, { status: 500 }) : NextResponse.json({ ok: true });
}
