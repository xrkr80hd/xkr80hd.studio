import { NextResponse } from 'next/server';
import { getCommunityDb, getSignedInMember, sameOrigin } from '../../../../lib/community';
import { isOwnStoragePath, validateProfile } from '../../../../lib/community-rules.mjs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const EDITABLE = ['display_name', 'member_type', 'city', 'state', 'zip', 'tagline', 'bio', 'website_url'];

export async function PATCH(request) {
  if (!sameOrigin(request)) return NextResponse.json({ error: 'Not allowed.' }, { status: 403 });
  const { member } = await getSignedInMember(request.cookies);
  if (!member) return NextResponse.json({ error: 'Please sign in again.' }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const input = Object.fromEntries(EDITABLE.filter((key) => key in body).map((key) => [key, body[key]]));
  const checked = validateProfile(input);
  if (!checked.ok) return NextResponse.json({ error: checked.error }, { status: 400 });

  const update = { ...checked.value };
  for (const key of ['avatar_path', 'cover_path']) {
    if (key in body) {
      const path = body[key] ? String(body[key]) : null;
      if (path) {
        const own = isOwnStoragePath(member.id, path)
          ? await getCommunityDb().from('community_media').select('id').eq('member_id', member.id).eq('kind', 'image').eq('storage_path', path).maybeSingle()
          : { data: null };
        if (!own.data) return NextResponse.json({ error: 'That picture is not one of your uploads.' }, { status: 400 });
      }
      update[key] = path;
    }
  }

  if (!Object.keys(update).length) return NextResponse.json({ ok: true, member });
  const { data, error } = await getCommunityDb().from('community_members').update(update).eq('id', member.id).select('*').single();
  if (error) return NextResponse.json({ error: 'Your changes could not be saved. Please try again.' }, { status: 500 });
  return NextResponse.json({ ok: true, member: data });
}
