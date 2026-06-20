import { NextResponse } from 'next/server';
import { clampText, isValidMediaUrl, toBoolean, toInteger } from '../../../../../../lib/admin-crud-utils';
import { getSupabaseAdmin } from '../../../../../../lib/supabase-admin';

export const runtime = 'nodejs';

function parseBandSlug(raw) {
  return String(raw || '').trim();
}

function buildBandTrackPayload(raw) {
  const title = clampText(raw?.title, 255);
  const description = String(raw?.description || '').trim();
  const audioUrl = String(raw?.audio_url || '').trim();
  const coverImageUrl = String(raw?.cover_image_url || '').trim();
  const sortOrder = toInteger(raw?.sort_order, 0, 0, 9999);
  const isPublished = raw?.is_published === undefined ? true : toBoolean(raw?.is_published);
  const includeInRadio = raw?.include_in_radio === undefined ? true : toBoolean(raw?.include_in_radio);

  if (!title) {
    return { ok: false, error: 'Track title is required.' };
  }
  if (!audioUrl) {
    return { ok: false, error: 'Audio URL is required.' };
  }
  if (!isValidMediaUrl(audioUrl) || !isValidMediaUrl(coverImageUrl)) {
    return { ok: false, error: 'Media URLs must start with https:// or /' };
  }

  return {
    ok: true,
    payload: {
      title,
      description: description || null,
      audio_url: audioUrl,
      cover_image_url: coverImageUrl || null,
      sort_order: sortOrder,
      is_published: isPublished,
      include_in_radio: includeInRadio,
    },
  };
}

async function findBandBySlug(supabase, slug) {
  return supabase.from('bands').select('id, slug, name').eq('slug', slug).limit(1).maybeSingle();
}

async function listBandTracks(supabase, bandId) {
  const withSort = await supabase
    .from('band_tracks')
    .select('*')
    .eq('band_id', bandId)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false });

  if (!withSort.error) {
    return { items: withSort.data || [], error: null };
  }

  const message = String(withSort.error.message || '');
  if (!message.includes('sort_order')) {
    return { items: [], error: message };
  }

  const fallback = await supabase
    .from('band_tracks')
    .select('*')
    .eq('band_id', bandId)
    .order('created_at', { ascending: false });

  if (fallback.error) {
    return { items: [], error: fallback.error.message };
  }

  return { items: (fallback.data || []).map((item) => ({ ...item, sort_order: 0 })), error: null };
}

export async function GET(request, { params }) {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ error: 'Missing Supabase server credentials.' }, { status: 500 });
  }

  const slug = parseBandSlug(params.slug);
  if (!slug) {
    return NextResponse.json({ error: 'Band slug is required.' }, { status: 400 });
  }

  const band = await findBandBySlug(supabase, slug);
  if (band.error) {
    return NextResponse.json({ error: band.error.message }, { status: 500 });
  }
  if (!band.data) {
    return NextResponse.json({ error: 'Band not found.' }, { status: 404 });
  }

  const tracks = await listBandTracks(supabase, band.data.id);
  if (tracks.error) {
    return NextResponse.json({ error: tracks.error }, { status: 500 });
  }

  return NextResponse.json({ items: tracks.items, band: band.data });
}

export async function POST(request, { params }) {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ error: 'Missing Supabase server credentials.' }, { status: 500 });
  }

  const slug = parseBandSlug(params.slug);
  if (!slug) {
    return NextResponse.json({ error: 'Band slug is required.' }, { status: 400 });
  }

  const band = await findBandBySlug(supabase, slug);
  if (band.error) {
    return NextResponse.json({ error: band.error.message }, { status: 500 });
  }
  if (!band.data) {
    return NextResponse.json({ error: 'Band not found.' }, { status: 404 });
  }

  const body = await request.json().catch(() => ({}));
  const parsed = buildBandTrackPayload(body);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const existingCount = await supabase
    .from('band_tracks')
    .select('id', { count: 'exact', head: true })
    .eq('band_id', band.data.id);

  if (existingCount.error) {
    return NextResponse.json({ error: existingCount.error.message }, { status: 500 });
  }

  if (Number(existingCount.count || 0) >= 3) {
    return NextResponse.json({ error: 'Bands can only publish up to 3 top tracks.' }, { status: 400 });
  }

  const insert = await supabase
    .from('band_tracks')
    .insert({
      ...parsed.payload,
      band_id: band.data.id,
    })
    .select('*')
    .limit(1)
    .maybeSingle();

  if (insert.error) {
    return NextResponse.json({ error: insert.error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, item: insert.data || null });
}
