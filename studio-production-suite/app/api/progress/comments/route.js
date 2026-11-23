import { NextResponse } from 'next/server';
import { getFamilyMember, getProgressDb, progressOwner, sameOrigin } from '../../../../lib/progress';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const UUID_RE = /^[0-9a-f-]{36}$/;

// Signed-in family leave a note under an update.
export async function POST(request) {
  if (!sameOrigin(request)) return NextResponse.json({ error: 'Not allowed.' }, { status: 403 });
  const member = await getFamilyMember(request.cookies);
  if (!member) return NextResponse.json({ error: 'Please sign in to leave a note.' }, { status: 401 });
  const raw = await request.json().catch(() => ({}));
  const body = String(raw.body || '').replace(/\r\n/g, '\n').trim();
  if (!UUID_RE.test(String(raw.post_id || ''))) return NextResponse.json({ error: 'Unknown update.' }, { status: 400 });
  if (!body || body.length > 2000) return NextResponse.json({ error: 'Write a note (up to 2000 characters).' }, { status: 400 });
  const db = getProgressDb();
  if (!db) return NextResponse.json({ error: 'Notes are unavailable right now.' }, { status: 503 });
  const { data, error } = await db.from('progress_comments')
    .insert({ post_id: raw.post_id, member_email: member.email, author_name: member.name || member.email.split('@')[0], body })
    .select('id, post_id, author_name, body, created_at').single();
  if (error) return NextResponse.json({ error: 'Your note could not be posted. Please retry.' }, { status: 500 });
  await db.from('progress_members').update({ last_seen_at: new Date().toISOString() }).eq('email', member.email);
  return NextResponse.json({ ok: true, item: data });
}

// The author or the owner can remove a note.
export async function DELETE(request) {
  if (!sameOrigin(request)) return NextResponse.json({ error: 'Not allowed.' }, { status: 403 });
  const id = new URL(request.url).searchParams.get('id') || '';
  if (!UUID_RE.test(id)) return NextResponse.json({ error: 'Unknown note.' }, { status: 400 });
  const db = getProgressDb();
  if (!db) return NextResponse.json({ error: 'Notes are unavailable right now.' }, { status: 503 });
  const owner = progressOwner(request);
  const member = owner ? null : await getFamilyMember(request.cookies);
  if (!owner && !member) return NextResponse.json({ error: 'Please sign in.' }, { status: 401 });
  let query = db.from('progress_comments').delete().eq('id', id);
  if (!owner) query = query.eq('member_email', member.email);
  const { data, error } = await query.select('id');
  if (error || !data?.length) return NextResponse.json({ error: 'That note could not be removed.' }, { status: 404 });
  return NextResponse.json({ ok: true });
}
