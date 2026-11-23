import { NextResponse } from 'next/server';
import { ADMIN_SESSION_USER_COOKIE, isOwnerUsername, ADMIN_SESSION_COOKIE, getAdminSessionUser } from '../../../../lib/admin-auth';
import { clampText, isValidMediaUrl, toBoolean } from '../../../../lib/admin-crud-utils';
import { getSupabaseAdmin } from '../../../../lib/supabase-admin';

export const runtime = 'nodejs';

function ownerGuard(request) {
  const actingUser = getAdminSessionUser(request.cookies.get(ADMIN_SESSION_COOKIE)?.value) || '';
  return isOwnerUsername(actingUser);
}

function missingColumnsHelp() {
  return 'Apply the latest Supabase schema SQL for this project to add homepage profile/message/image columns.';
}

function hasMissingColumnsMessage(message) {
  return (
    message.includes('welcome_message') ||
    message.includes('blog_notice_message') ||
    message.includes('home_legends_card_image_url') ||
    message.includes('home_scene_card_image_url') ||
    message.includes('home_podcast_card_image_url') ||
    message.includes('home_hub_card_image_url') ||
    message.includes('home_business_card_image_url') ||
    message.includes('home_contact_card_image_url') ||
    message.includes('home_new_tracks_alert_enabled')
  );
}

function buildPayload(raw) {
  const headline = clampText(raw?.headline, 255);
  const welcomeMessage = clampText(raw?.welcome_message, 220);
  const blogNoticeMessage = clampText(raw?.blog_notice_message, 180);
  const shortBio = clampText(raw?.short_bio, 300);
  const fullBio = String(raw?.full_bio || '').trim();
  const avatarUrl = String(raw?.avatar_url || '').trim();
  const legendsCardImageUrl = String(raw?.home_legends_card_image_url || '').trim();
  const sceneCardImageUrl = String(raw?.home_scene_card_image_url || '').trim();
  const podcastCardImageUrl = String(raw?.home_podcast_card_image_url || '').trim();
  const hubCardImageUrl = String(raw?.home_hub_card_image_url || '').trim();
  const businessCardImageUrl = String(raw?.home_business_card_image_url || '').trim();
  const contactCardImageUrl = String(raw?.home_contact_card_image_url || '').trim();
  const homeNewTracksAlertEnabled = toBoolean(raw?.home_new_tracks_alert_enabled);

  if (
    !isValidMediaUrl(avatarUrl) ||
    !isValidMediaUrl(legendsCardImageUrl) ||
    !isValidMediaUrl(sceneCardImageUrl) ||
    !isValidMediaUrl(podcastCardImageUrl) ||
    !isValidMediaUrl(hubCardImageUrl) ||
    !isValidMediaUrl(businessCardImageUrl) ||
    !isValidMediaUrl(contactCardImageUrl)
  ) {
    return { ok: false, error: 'Image URLs must start with https:// or /' };
  }

  return {
    ok: true,
    payload: {
      headline: headline || null,
      welcome_message: welcomeMessage || null,
      blog_notice_message: blogNoticeMessage || null,
      short_bio: shortBio || null,
      full_bio: fullBio || null,
      avatar_url: avatarUrl || null,
      home_legends_card_image_url: legendsCardImageUrl || null,
      home_scene_card_image_url: sceneCardImageUrl || null,
      home_podcast_card_image_url: podcastCardImageUrl || null,
      home_hub_card_image_url: hubCardImageUrl || null,
      home_business_card_image_url: businessCardImageUrl || null,
      home_contact_card_image_url: contactCardImageUrl || null,
      home_new_tracks_alert_enabled: homeNewTracksAlertEnabled,
    },
  };
}

async function getFirstProfileRow(supabase) {
  return supabase.from('site_profiles').select('*').order('id', { ascending: true }).limit(1);
}

export async function GET(request) {
  if (!ownerGuard(request)) {
    return NextResponse.json({ error: 'Only the owner account can manage site profile settings.' }, { status: 403 });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ error: 'Missing Supabase server credentials.' }, { status: 500 });
  }

  const result = await getFirstProfileRow(supabase);
  if (result.error) {
    const message = String(result.error.message || '');
    if (hasMissingColumnsMessage(message)) {
      return NextResponse.json({ error: `${message} ${missingColumnsHelp()}` }, { status: 500 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }

  return NextResponse.json({ item: (result.data && result.data[0]) || null });
}

export async function PUT(request) {
  if (!ownerGuard(request)) {
    return NextResponse.json({ error: 'Only the owner account can manage site profile settings.' }, { status: 403 });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ error: 'Missing Supabase server credentials.' }, { status: 500 });
  }

  const body = await request.json().catch(() => ({}));
  const parsed = buildPayload(body);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const existing = await getFirstProfileRow(supabase);
  if (existing.error) {
    return NextResponse.json({ error: existing.error.message }, { status: 500 });
  }

  const existingRow = (existing.data && existing.data[0]) || null;
  const mutation = existingRow
    ? supabase.from('site_profiles').update(parsed.payload).eq('id', existingRow.id).select('*').limit(1).maybeSingle()
    : supabase.from('site_profiles').insert(parsed.payload).select('*').limit(1).maybeSingle();

  const saved = await mutation;
  if (saved.error) {
    const message = String(saved.error.message || '');
    if (hasMissingColumnsMessage(message)) {
      return NextResponse.json({ error: `${message} ${missingColumnsHelp()}` }, { status: 500 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, item: saved.data || null });
}
