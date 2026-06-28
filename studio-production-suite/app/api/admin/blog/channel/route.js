import { NextResponse } from 'next/server';
import { ADMIN_SESSION_USER_COOKIE, isOwnerUsername } from '../../../../../lib/admin-auth';
import { isValidMediaUrl } from '../../../../../lib/admin-crud-utils';
import { normalizeAdminUsername } from '../../../../../lib/admin-users';
import { getDefaultBlogChannelName, normalizeBlogChannelName, toBlogChannelSlug } from '../../../../../lib/blog-channels';
import { getSupabaseAdmin } from '../../../../../lib/supabase-admin';

export const runtime = 'nodejs';

const BLOG_CHANNEL_DEFAULT_CARD_IMAGE = '/assets/cards/local-blog.png';
const OWNER_BLOG_CHANNEL_COVER_IMAGE = '/assets/blog/xrkr80hdblog.png';

function getActingUser(request) {
  return normalizeAdminUsername(request.cookies.get(ADMIN_SESSION_USER_COOKIE)?.value || '');
}

function isMissingChannelTableError(error) {
  return String(error?.message || '').includes('public.blog_channels') && String(error?.message || '').includes('Could not find the table');
}

function toSettingsPayload(raw, username) {
  const channelName = normalizeBlogChannelName(raw?.channel_name, username);
  const avatarUrl = String(raw?.avatar_url || '').trim();
  const cardImageUrl = String(raw?.card_image_url || '').trim();
  const bloggerBio = String(raw?.blogger_bio || '').trim();

  if (avatarUrl && !isValidMediaUrl(avatarUrl)) {
    return { ok: false, error: 'Profile image URL must start with https:// or /' };
  }
  if (!isValidMediaUrl(cardImageUrl)) {
    return { ok: false, error: 'Card image URL must start with https:// or /' };
  }

  return {
    ok: true,
    payload: {
      username,
      channel_name: channelName,
      channel_slug: toBlogChannelSlug(channelName, username),
      blogger_bio: bloggerBio || null,
      avatar_url: avatarUrl || null,
      card_image_url: cardImageUrl || null,
      updated_at: new Date().toISOString(),
    },
  };
}

async function ensureUniqueChannelSlug(supabase, slug, username) {
  let counter = 1;
  let candidate = slug;

  while (counter < 200) {
    const existing = await supabase.from('blog_channels').select('username').eq('channel_slug', candidate).limit(1).maybeSingle();

    if (existing.error) {
      return { ok: false, error: existing.error.message };
    }

    const matchedUser = normalizeAdminUsername(existing?.data?.username || '');
    if (!matchedUser || matchedUser === username) {
      return { ok: true, slug: candidate };
    }

    counter += 1;
    candidate = `${slug}-${counter}`;
  }

  return { ok: false, error: 'Could not generate a unique channel URL slug.' };
}

function defaultChannelItem(username) {
  const channelName = getDefaultBlogChannelName(username);
  return {
    username,
    channel_name: channelName,
    channel_slug: toBlogChannelSlug(channelName, username),
    blogger_bio: null,
    avatar_url: null,
    card_image_url: null,
  };
}

function withDefaultChannelImages(item, username) {
  return {
    ...item,
    card_image_url:
      String(item?.card_image_url || '').trim() ||
      (isOwnerUsername(username) ? OWNER_BLOG_CHANNEL_COVER_IMAGE : BLOG_CHANNEL_DEFAULT_CARD_IMAGE),
  };
}

function isMissingBloggerBioColumnError(error) {
  const msg = String(error?.message || '').toLowerCase();
  return msg.includes('blogger_bio') && msg.includes('column');
}

export async function GET(request) {
  const actingUser = getActingUser(request);
  if (!actingUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ error: 'Missing Supabase server credentials.' }, { status: 500 });
  }

  const response = await supabase.from('blog_channels').select('*').eq('username', actingUser).limit(1).maybeSingle();

  if (response.error) {
    if (isMissingChannelTableError(response.error)) {
      return NextResponse.json({
        ok: true,
        item: defaultChannelItem(actingUser),
        warning: 'Blog channel settings table is not set up yet. Run latest schema SQL to persist settings.',
      });
    }

    return NextResponse.json({ error: response.error.message }, { status: 500 });
  }

  const item = withDefaultChannelImages(response.data || defaultChannelItem(actingUser), actingUser);
  return NextResponse.json({ ok: true, item });
}

export async function PUT(request) {
  const actingUser = getActingUser(request);
  if (!actingUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ error: 'Missing Supabase server credentials.' }, { status: 500 });
  }

  const body = await request.json().catch(() => ({}));
  const parsed = toSettingsPayload(body, actingUser);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const uniqueSlug = await ensureUniqueChannelSlug(supabase, parsed.payload.channel_slug, actingUser);
  if (!uniqueSlug.ok) {
    return NextResponse.json({ error: uniqueSlug.error }, { status: 500 });
  }

  const upsert = await supabase
    .from('blog_channels')
    .upsert({
      ...parsed.payload,
      channel_slug: uniqueSlug.slug,
      created_at: new Date().toISOString(),
    }, { onConflict: 'username' })
    .select('*')
    .limit(1)
    .maybeSingle();

  if (upsert.error) {
    if (isMissingBloggerBioColumnError(upsert.error)) {
      const fallbackUpsert = await supabase
        .from('blog_channels')
        .upsert({
          username: parsed.payload.username,
          channel_name: parsed.payload.channel_name,
          channel_slug: uniqueSlug.slug,
          avatar_url: parsed.payload.avatar_url,
          card_image_url: parsed.payload.card_image_url,
          updated_at: parsed.payload.updated_at,
          created_at: new Date().toISOString(),
        }, { onConflict: 'username' })
        .select('*')
        .limit(1)
        .maybeSingle();

      if (fallbackUpsert.error) {
        return NextResponse.json({ error: fallbackUpsert.error.message }, { status: 500 });
      }

      return NextResponse.json({
        ok: true,
        item: {
          ...(fallbackUpsert.data || defaultChannelItem(actingUser)),
          avatar_url: parsed.payload.avatar_url || null,
          blogger_bio: parsed.payload.blogger_bio || null,
        },
        warning: 'Blogger bio column is not available yet. Run latest schema SQL to persist bios.',
      });
    }

    if (String(upsert.error?.message || '').includes('avatar_url') && String(upsert.error?.message || '').includes('column')) {
      const fallbackUpsert = await supabase
        .from('blog_channels')
        .upsert({
          username: parsed.payload.username,
          channel_name: parsed.payload.channel_name,
          channel_slug: uniqueSlug.slug,
          blogger_bio: parsed.payload.blogger_bio,
          card_image_url: parsed.payload.card_image_url,
          updated_at: parsed.payload.updated_at,
          created_at: new Date().toISOString(),
        }, { onConflict: 'username' })
        .select('*')
        .limit(1)
        .maybeSingle();

      if (fallbackUpsert.error) {
        return NextResponse.json({ error: fallbackUpsert.error.message }, { status: 500 });
      }

      return NextResponse.json({
        ok: true,
        item: { ...(fallbackUpsert.data || defaultChannelItem(actingUser)), avatar_url: parsed.payload.avatar_url || null },
        warning: 'Profile image column is not available yet. Run latest schema SQL to persist profile photos.',
      });
    }

    if (isMissingChannelTableError(upsert.error)) {
      return NextResponse.json({ error: 'Blog channel settings table is missing. Run latest schema SQL first.' }, { status: 500 });
    }
    return NextResponse.json({ error: upsert.error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, item: upsert.data || defaultChannelItem(actingUser) });
}
