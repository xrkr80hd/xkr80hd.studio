import { NextResponse } from 'next/server';
import { getCommunityAuthClient, isCommunityConfigured, sameOrigin, siteOrigin } from '../../../../../lib/community';
import { normalizeEmail, validateSignup } from '../../../../../lib/community-rules.mjs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Emails a sign-in link. "join" creates the account on first click;
// "signin" only works for an email that already has an account.
export async function POST(request) {
  if (!sameOrigin(request)) return NextResponse.json({ error: 'Not allowed.' }, { status: 403 });
  if (!isCommunityConfigured()) return NextResponse.json({ error: 'Sign-up is not switched on for this site yet.' }, { status: 503 });

  const body = await request.json().catch(() => ({}));
  const mode = body.mode === 'signin' ? 'signin' : 'join';
  const auth = getCommunityAuthClient();
  const emailRedirectTo = `${siteOrigin(request)}/join/callback`;

  let email = '';
  let data;
  if (mode === 'join') {
    const checked = validateSignup(body);
    if (!checked.ok) return NextResponse.json({ error: checked.error }, { status: 400 });
    email = checked.value.email;
    const { email: _ignored, ...profile } = checked.value;
    data = { yourlocal_signup: profile };
  } else {
    email = normalizeEmail(body.email);
    if (!email) return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 });
  }

  const { error } = await auth.auth.signInWithOtp({
    email,
    options: { emailRedirectTo, shouldCreateUser: mode === 'join', data },
  });

  if (error) {
    const message = String(error.message || '');
    if (mode === 'signin' && /signups not allowed|not found|user not found/i.test(message)) {
      return NextResponse.json({ error: "We couldn't find an account for that email. Join free instead." }, { status: 404 });
    }
    if (/rate limit|too many|security purposes/i.test(message)) {
      return NextResponse.json({ error: 'A link was just sent. Check your inbox and spam folder, or try again in a minute.' }, { status: 429 });
    }
    return NextResponse.json({ error: 'The email could not be sent. Please try again.' }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
