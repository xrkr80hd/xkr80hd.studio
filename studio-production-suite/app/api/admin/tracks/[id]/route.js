import { NextResponse } from 'next/server';
import { ADMIN_SESSION_USER_COOKIE, isOwnerUsername, ADMIN_SESSION_COOKIE, getAdminSessionUser } from '../../../../../lib/admin-auth';
import { clampText, toBoolean, toInteger, isValidMediaUrl } from '../../../../../lib/admin-crud-utils';
import { getSupabaseAdmin } from '../../../../../lib/supabase-admin';

export const runtime = 'nodejs';

function ownerGuard(request) {
  const actingUser = getAdminSessionUser(request.cookies.get(ADMIN_SESSION_COOKIE)?.value) || '';
  return isOwnerUsername(actingUser);
}

function sortColumnHelp() {
  return 'Apply the latest Supabase schema SQL for this project to add tracks.sort_order.';
}

function formatDateForDb(value) {
  const raw = String(value || '').trim();
  if (!raw) {
    return null;
  }

  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toISOString().slice(0, 10);
}

function parseTrackId(rawId) {
  const id = Number.parseInt(String(rawId || ''), 10);
  if (!Number.isFinite(id) || id <= 0) {
    return null;
  }
  return id;
}

function normalizeStorageKey(value) {
  return String(value || '')
    .trim()
    .replace(/[^a-zA-Z0-9._/-]/g, '-')
    .replace(/\/+/g, '/')
    .replace(/^\/+|\/+$/g, '');
}

function getStorageKeyFromPublicUrl(value, bucket) {
  const raw = String(value || '').trim();
  if (!raw) {
    return '';
  }

  const withoutQuery = raw.split('?')[0];
  const marker = `/storage/v1/object/public/${bucket}/`;
  const markerIndex = withoutQuery.indexOf(marker);
  if (markerIndex < 0) {
    return '';
  }

  const encodedKey = withoutQuery.slice(markerIndex + marker.length);
  try {
    return normalizeStorageKey(decodeURIComponent(encodedKey));
  } catch {
    return normalizeStorageKey(encodedKey);
  }
}

function buildTrackPayload(raw) {
  const title = clampText(raw?.title, 255);
  const artistName = clampText(raw?.artist_name || 'xrkr80hd', 255);
  const genre = clampText(raw?.genre, 80);
  const description = String(raw?.description || '').trim();
  const audioUrl = String(raw?.audio_url || '').trim();
  const coverImageUrl = String(raw?.cover_image_url || '').trim();
  const externalUrl = String(raw?.external_url || '').trim();
  const releaseDate = formatDateForDb(raw?.release_date);
  const sortOrder = toInteger(raw?.sort_order, 0, 0, 9999);
  const isFeatured = toBoolean(raw?.is_featured);

  if (!title) {
    return { ok: false, error: 'Track title is required.' };
  }

  if (!audioUrl) {
    return { ok: false, error: 'Audio URL is required.' };
  }

  if (!isValidMediaUrl(audioUrl) || !isValidMediaUrl(coverImageUrl) || !isValidMediaUrl(externalUrl)) {
    return { ok: false, error: 'Media URLs must start with https:// or /' };
  }

  return {
    ok: true,
    payload: {
      title,
      artist_name: artistName || 'xrkr80hd',
      genre: genre || null,
      description: description || null,
      audio_url: audioUrl,
      cover_image_url: coverImageUrl || null,
      external_url: externalUrl || null,
      release_date: releaseDate,
      sort_order: sortOrder,
      is_featured: isFeatured,
    },
  };
}

async function findTrackById(supabase, id) {
  return supabase.from('tracks').select('*').eq('id', id).limit(1).maybeSingle();
}

export async function PUT(request, { params }) {
  if (!ownerGuard(request)) {
    return NextResponse.json({ error: 'Only the owner account can manage tracks.' }, { status: 403 });
  }

  const id = parseTrackId(params.id);
  if (!id) {
    return NextResponse.json({ error: 'Invalid track id.' }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ error: 'Missing Supabase server credentials.' }, { status: 500 });
  }

  const existing = await findTrackById(supabase, id);
  if (existing.error) {
    return NextResponse.json({ error: existing.error.message }, { status: 500 });
  }
  if (!existing.data) {
    return NextResponse.json({ error: 'Track not found.' }, { status: 404 });
  }

  const body = await request.json().catch(() => ({}));
  const parsed = buildTrackPayload(body);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const update = await supabase.from('tracks').update(parsed.payload).eq('id', id).select('*').limit(1).maybeSingle();
  if (update.error) {
    const message = String(update.error.message || '');
    if (message.includes('sort_order')) {
      return NextResponse.json({ error: `${message} ${sortColumnHelp()}` }, { status: 500 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, item: update.data || null });
}

export async function DELETE(request, { params }) {
  if (!ownerGuard(request)) {
    return NextResponse.json({ error: 'Only the owner account can manage tracks.' }, { status: 403 });
  }

  const id = parseTrackId(params.id);
  if (!id) {
    return NextResponse.json({ error: 'Invalid track id.' }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ error: 'Missing Supabase server credentials.' }, { status: 500 });
  }

  const existing = await findTrackById(supabase, id);
  if (existing.error) {
    return NextResponse.json({ error: existing.error.message }, { status: 500 });
  }
  if (!existing.data) {
    return NextResponse.json({ error: 'Track not found.' }, { status: 404 });
  }

  const bucket = process.env.SUPABASE_STORAGE_BUCKET || 'uploads';
  const audioKey = getStorageKeyFromPublicUrl(existing.data.audio_url, bucket);
  const coverKey = getStorageKeyFromPublicUrl(existing.data.cover_image_url, bucket);
  const keysToDelete = Array.from(new Set([audioKey, coverKey].filter(Boolean)));

  const deleted = await supabase.from('tracks').delete().eq('id', id);
  if (deleted.error) {
    return NextResponse.json({ error: deleted.error.message }, { status: 500 });
  }

  let storageWarnings = [];
  if (keysToDelete.length) {
    const removeResult = await supabase.storage.from(bucket).remove(keysToDelete);
    if (removeResult.error) {
      storageWarnings.push(`Track row deleted, but storage cleanup failed: ${removeResult.error.message}`);
    }
  }

  return NextResponse.json({
    ok: true,
    storage_cleanup: {
      attempted: keysToDelete.length,
      warnings: storageWarnings,
    },
  });
}
