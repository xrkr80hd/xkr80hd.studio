import { NextResponse } from 'next/server';
import {
  getCommunityAuthClient,
  getCommunityDb,
  isCommunityConfigured,
  isMissingCommunityTable,
  makeMemberSession,
  memberCookieOptions,
  sameOrigin,
} from '../../../../../lib/community';
import { toHandle, validateSignup } from '../../../../../lib/community-rules.mjs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function pickFreeHandle(db, wanted) {
  const base = toHandle(wanted);
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const candidate = attempt === 0 ? base : `${base.slice(0, 34)}-${Math.floor(1000 + Math.random() * 9000)}`;
    const { data } = await db.from('community_members').select('id').eq('handle', candidate).maybeSingle();
    if (!data) return candidate;
  }
  return `${base.slice(0, 30)}-${Date.now().toString(36)}`;
}

// The emailed link lands on /join/callback, which posts the Supabase access token here.
// We check it with Supabase, create the member row on first visit, and set our own cookie.
export async function POST(request) {
  if (!sameOrigin(request)) return NextResponse.json({ error: 'Not allowed.' }, { status: 403 });
  if (!isCommunityConfigured()) return NextResponse.json({ error: 'Sign-up is not switched on for this site yet.' }, { status: 503 });

  const body = await request.json().catch(() => ({}));
  const accessToken = String(body.access_token || '');
  if (!accessToken) return NextResponse.json({ error: 'That sign-in link is missing its code. Request a new one.' }, { status: 400 });

  const { data: userData, error: userError } = await getCommunityAuthClient().auth.getUser(accessToken);
  const user = userData?.user;
  if (userError || !user?.id || !user.email) {
    return NextResponse.json({ error: 'That sign-in link has expired. Request a new one.' }, { status: 401 });
  }

  const db = getCommunityDb();
  const existing = await db.from('community_members').select('id, status').eq('id', user.id).maybeSingle();
  if (existing.error) {
    const setup = isMissingCommunityTable(existing.error);
    return NextResponse.json({ error: setup ? 'Member accounts are not set up yet. Run the YourLocal SQL in Supabase.' : 'Sign-in is unavailable right now.' }, { status: 503 });
  }
  if (existing.data?.status === 'banned') {
    return NextResponse.json({ error: 'This account has been turned off.' }, { status: 403 });
  }

  let isNew = false;
  if (!existing.data) {
    const signup = validateSignup({ ...(user.user_metadata?.yourlocal_signup || {}), email: user.email });
    if (!signup.ok) {
      return NextResponse.json({ error: 'We could not find your sign-up details. Please join again.' }, { status: 400 });
    }
    const handle = await pickFreeHandle(db, signup.value.display_name);
    const insert = await db.from('community_members').insert({ id: user.id, handle, status: 'active', ...signup.value });
    if (insert.error) return NextResponse.json({ error: 'Your account could not be created. Please try again.' }, { status: 500 });
    isNew = true;
  }

  const response = NextResponse.json({ ok: true, isNew });
  response.cookies.set(memberCookieOptions(makeMemberSession(user.id)));
  return response;
}
