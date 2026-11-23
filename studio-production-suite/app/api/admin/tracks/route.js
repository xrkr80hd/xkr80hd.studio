import { NextResponse } from 'next/server';
import { ADMIN_SESSION_USER_COOKIE, isOwnerUsername, ADMIN_SESSION_COOKIE, getAdminSessionUser } from '../../../../lib/admin-auth';
import { clampText, toBoolean, toInteger, isValidMediaUrl } from '../../../../lib/admin-crud-utils';
import { getSupabaseAdmin } from '../../../../lib/supabase-admin';

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

async function listTracks(supabase, includeSortOrder = true) {
  let query = supabase
    .from('tracks')
    .select('*')
    .order('release_date', { ascending: false, nullsFirst: false })
    .order('id', { ascending: false });

  if (includeSortOrder) {
    query = supabase
      .from('tracks')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('release_date', { ascending: false, nullsFirst: false })
      .order('id', { ascending: false });
  }

  return query;
}

function withSortFallback(items = []) {
  return items.map((item) => ({
    ...item,
    sort_order: Number.isFinite(Number(item?.sort_order)) ? Number(item.sort_order) : 0,
  }));
}

export async function GET(request) {
  if (!ownerGuard(request)) {
    return NextResponse.json({ error: 'Only the owner account can manage tracks.' }, { status: 403 });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ error: 'Missing Supabase server credentials.' }, { status: 500 });
  }

  const withSort = await listTracks(supabase, true);
  if (!withSort.error) {
    return NextResponse.json({ items: withSort.data || [] });
  }

  const sortMessage = String(withSort.error.message || '');
  if (!sortMessage.includes('sort_order')) {
    return NextResponse.json({ error: sortMessage }, { status: 500 });
  }

  const fallback = await listTracks(supabase, false);
  if (fallback.error) {
    return NextResponse.json({ error: fallback.error.message }, { status: 500 });
  }

  return NextResponse.json({
    items: withSortFallback(fallback.data || []),
    warning: sortColumnHelp(),
  });
}

export async function POST(request) {
  if (!ownerGuard(request)) {
    return NextResponse.json({ error: 'Only the owner account can manage tracks.' }, { status: 403 });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ error: 'Missing Supabase server credentials.' }, { status: 500 });
  }

  const body = await request.json().catch(() => ({}));
  const parsed = buildTrackPayload(body);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const insert = await supabase.from('tracks').insert(parsed.payload).select('*').limit(1).maybeSingle();
  if (insert.error) {
    const message = String(insert.error.message || '');
    if (message.includes('sort_order')) {
      return NextResponse.json({ error: `${message} ${sortColumnHelp()}` }, { status: 500 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, item: insert.data || null });
}
