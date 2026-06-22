import { getAdminOwnerUsername, isOwnerUsername } from './admin-auth.js';

function normalizeUsername(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, '')
    .slice(0, 48);
}

function slugify(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function getDefaultName(username) {
  const safeUsername = normalizeUsername(username);

  if (!safeUsername) {
    return 'localblog';
  }

  if (isOwnerUsername(safeUsername) || safeUsername === getAdminOwnerUsername()) {
    return 'xrkr80hdblog';
  }

  const compact = safeUsername.replace(/[^a-z0-9]/g, '');
  return `${compact || safeUsername}blog`;
}

function isMissingBlogChannelsTable(error) {
  const message = String(error?.message || '');
  return message.includes('public.blog_channels') && message.includes('Could not find the table');
}

export function buildDefaultBlogChannel(username) {
  const safeUsername = normalizeUsername(username);
  const channelName = getDefaultName(safeUsername);

  return {
    username: safeUsername,
    channel_name: channelName,
    channel_slug: slugify(channelName).slice(0, 140) || 'localblog',
    blogger_bio: null,
    avatar_url: null,
    card_image_url: null,
  };
}

export async function provisionBlogChannel(username, { supabase } = {}) {
  const channel = buildDefaultBlogChannel(username);

  if (!channel.username) {
    return { ok: false, missingTable: false, channel: null, error: 'Invalid blogger username.' };
  }

  if (!supabase) {
    return {
      ok: false,
      missingTable: false,
      channel: null,
      error: 'Missing Supabase server credentials.',
    };
  }

  const result = await supabase
    .from('blog_channels')
    .upsert(channel, { onConflict: 'username', ignoreDuplicates: true })
    .select('*')
    .limit(1)
    .maybeSingle();

  if (result.error) {
    return {
      ok: false,
      missingTable: isMissingBlogChannelsTable(result.error),
      channel: null,
      error: result.error.message,
    };
  }

  if (result.data) {
    return { ok: true, missingTable: false, channel: result.data, error: null };
  }

  const existing = await supabase
    .from('blog_channels')
    .select('*')
    .eq('username', channel.username)
    .limit(1)
    .maybeSingle();

  if (existing.error) {
    return {
      ok: false,
      missingTable: isMissingBlogChannelsTable(existing.error),
      channel: null,
      error: existing.error.message,
    };
  }

  return {
    ok: Boolean(existing.data),
    missingTable: false,
    channel: existing.data || null,
    error: existing.data ? null : 'Blog channel could not be provisioned.',
  };
}
