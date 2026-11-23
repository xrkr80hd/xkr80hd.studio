import { NextResponse } from 'next/server';
import { getFamilyMember, getProgressDb, sameOrigin } from '../../../../lib/progress';
import { validReaction } from '../../../../lib/progress-reactions.mjs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const UUID_RE = /^[0-9a-f-]{36}$/;

// Signed-in family tap a reaction to add it, tap again to take it back.
export async function POST(request) {
  if (!sameOrigin(request)) return NextResponse.json({ error: 'Not allowed.' }, { status: 403 });
  const member = await getFamilyMember(request.cookies);
  if (!member) return NextResponse.json({ error: 'Please sign in to react.' }, { status: 401 });
  const raw = await request.json().catch(() => ({}));
  if (!UUID_RE.test(String(raw.post_id || '')) || !validReaction(raw.emoji)) return NextResponse.json({ error: 'Invalid reaction.' }, { status: 400 });
  const db = getProgressDb();
  if (!db) return NextResponse.json({ error: 'Reactions are unavailable right now.' }, { status: 503 });
  const key = { post_id: raw.post_id, member_email: member.email, emoji: raw.emoji };
  const removed = await db.from('progress_reactions').delete().match(key).select('emoji');
  if (removed.error) return NextResponse.json({ error: 'Reactions are unavailable right now.' }, { status: 503 });
  if (removed.data?.length) return NextResponse.json({ ok: true, active: false });
  const added = await db.from('progress_reactions').insert(key);
  if (added.error) return NextResponse.json({ error: 'Your reaction could not be saved.' }, { status: 500 });
  return NextResponse.json({ ok: true, active: true });
}
