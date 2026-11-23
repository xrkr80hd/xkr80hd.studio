import { NextResponse } from 'next/server';
import { COMMUNITY_BUCKET, getCommunityDb, getSignedInMember, sameOrigin } from '../../../../lib/community';
import { MEDIA_LIMITS, isOwnStoragePath, mediaKindForMime } from '../../../../lib/community-rules.mjs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Saves a finished upload to the member's list. The file itself is checked in
// storage, so the size and type come from what was really uploaded.
export async function POST(request) {
  if (!sameOrigin(request)) return NextResponse.json({ error: 'Not allowed.' }, { status: 403 });
  const { member } = await getSignedInMember(request.cookies);
  if (!member) return NextResponse.json({ error: 'Please sign in again.' }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const path = String(body.path || '');
  if (!isOwnStoragePath(member.id, path)) return NextResponse.json({ error: 'That upload is not yours.' }, { status: 400 });

  const db = getCommunityDb();
  const folder = path.slice(0, path.lastIndexOf('/'));
  const fileName = path.slice(path.lastIndexOf('/') + 1);
  const listing = await db.storage.from(COMMUNITY_BUCKET).list(folder, { search: fileName, limit: 5 });
  const object = (listing.data || []).find((item) => item.name === fileName);
  if (!object) return NextResponse.json({ error: 'The upload did not finish. Please try again.' }, { status: 400 });

  const mime = String(object.metadata?.mimetype || '').toLowerCase();
  const size = Number(object.metadata?.size || 0);
  const kind = mediaKindForMime(mime);
  const limit = kind ? MEDIA_LIMITS[kind] : null;

  const reject = async (message) => {
    await db.storage.from(COMMUNITY_BUCKET).remove([path]);
    return NextResponse.json({ error: message }, { status: 400 });
  };

  if (!kind || !path.startsWith(`${member.id}/${kind}/`)) return reject('That file type is not supported.');
  if (!size || size > limit.maxBytes) return reject('That file is too big.');

  const { count } = await db.from('community_media').select('id', { count: 'exact', head: true }).eq('member_id', member.id).eq('kind', kind);
  if ((count || 0) >= limit.count) return reject(`You can have up to ${limit.count} ${limit.label}.`);

  const title = String(body.title || '').trim().slice(0, 120) || null;
  const { data, error } = await db
    .from('community_media')
    .insert({ member_id: member.id, kind, title, storage_path: path, mime_type: mime, size_bytes: size })
    .select('id, kind, title, storage_path, mime_type, size_bytes, created_at')
    .single();
  if (error) return reject('The upload could not be saved. Please try again.');

  const signed = await db.storage.from(COMMUNITY_BUCKET).createSignedUrl(path, 3600);
  return NextResponse.json({ ok: true, item: { ...data, url: signed.data?.signedUrl || '' } });
}

export async function DELETE(request) {
  if (!sameOrigin(request)) return NextResponse.json({ error: 'Not allowed.' }, { status: 403 });
  const { member } = await getSignedInMember(request.cookies);
  if (!member) return NextResponse.json({ error: 'Please sign in again.' }, { status: 401 });

  const id = Number.parseInt(new URL(request.url).searchParams.get('id') || '', 10);
  if (!Number.isFinite(id)) return NextResponse.json({ error: 'Pick an upload to remove.' }, { status: 400 });

  const db = getCommunityDb();
  const { data: item } = await db.from('community_media').select('id, storage_path').eq('id', id).eq('member_id', member.id).maybeSingle();
  if (!item) return NextResponse.json({ error: 'That upload was not found.' }, { status: 404 });

  await db.storage.from(COMMUNITY_BUCKET).remove([item.storage_path]);
  await db.from('community_media').delete().eq('id', item.id).eq('member_id', member.id);

  const clear = {};
  if (member.avatar_path === item.storage_path) clear.avatar_path = null;
  if (member.cover_path === item.storage_path) clear.cover_path = null;
  if (Object.keys(clear).length) await db.from('community_members').update(clear).eq('id', member.id);

  return NextResponse.json({ ok: true });
}
