import { randomUUID } from 'crypto';
import { NextResponse } from 'next/server';
import { COMMUNITY_BUCKET, getCommunityDb, getSignedInMember, sameOrigin } from '../../../../../lib/community';
import { checkUploadAllowed, mediaKindForMime, safeFileName } from '../../../../../lib/community-rules.mjs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Hands out a one-time upload link into the member's own folder,
// after checking the file type, size and how many they already have.
export async function POST(request) {
  if (!sameOrigin(request)) return NextResponse.json({ error: 'Not allowed.' }, { status: 403 });
  const { member } = await getSignedInMember(request.cookies);
  if (!member) return NextResponse.json({ error: 'Please sign in again.' }, { status: 401 });
  if (member.status !== 'active') return NextResponse.json({ error: 'Uploads are paused on this account.' }, { status: 403 });

  const body = await request.json().catch(() => ({}));
  const mime = String(body.mime || '').toLowerCase();
  const kind = mediaKindForMime(mime);
  const db = getCommunityDb();

  const { count, error: countError } = await db
    .from('community_media')
    .select('id', { count: 'exact', head: true })
    .eq('member_id', member.id)
    .eq('kind', kind || 'none');
  if (countError) return NextResponse.json({ error: 'Uploads are unavailable right now.' }, { status: 503 });

  const allowed = checkUploadAllowed({ mime, size: body.size, existingCount: count || 0 });
  if (!allowed.ok) return NextResponse.json({ error: allowed.error }, { status: 400 });

  const path = `${member.id}/${allowed.kind}/${randomUUID()}-${safeFileName(body.name)}`;
  const { data, error } = await db.storage.from(COMMUNITY_BUCKET).createSignedUploadUrl(path);
  if (error || !data?.signedUrl) return NextResponse.json({ error: 'Uploads are unavailable right now.' }, { status: 503 });

  return NextResponse.json({ ok: true, path, uploadUrl: data.signedUrl, kind: allowed.kind });
}
