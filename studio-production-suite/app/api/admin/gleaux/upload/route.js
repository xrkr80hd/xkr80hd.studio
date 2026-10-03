import { randomUUID } from 'crypto';
import { NextResponse } from 'next/server';
import { gleauxOwner, sameOrigin } from '../../../../../lib/gleaux';
import { GLEAUX_BUCKET, MAX_AUDIO_BYTES, audioType, validAudioPath } from '../../../../../lib/gleaux-validation.mjs';
import { getSupabaseAdmin } from '../../../../../lib/supabase-admin';
export const runtime = 'nodejs';
export async function POST(request) {
  if (!gleauxOwner(request) || !sameOrigin(request)) return NextResponse.json({ error: 'Owner access required.' }, { status: 403 });
  const db = getSupabaseAdmin();
  if (!db) return NextResponse.json({ error: 'Storage unavailable.' }, { status: 503 });
  const body = await request.json().catch(() => ({}));
  if (!['player', 'download'].includes(body.slot)) return NextResponse.json({ error: 'Invalid upload slot.' }, { status: 400 });
  const filename = String(body.filename || '').replace(/[^a-zA-Z0-9._-]/g, '-').slice(-160);
  const contentType = audioType(filename);
  if (!contentType || !Number.isFinite(body.size) || body.size <= 0 || body.size > MAX_AUDIO_BYTES) return NextResponse.json({ error: 'Choose MP3, WAV, M4A, OGG, or FLAC audio, up to 200 MB.' }, { status: 400 });
  const path = `${body.slot}/${randomUUID()}-${filename}`;
  const { data, error } = await db.storage.from(GLEAUX_BUCKET).createSignedUploadUrl(path);
  if (error) return NextResponse.json({ error: 'Could not start upload.' }, { status: 500 });
  return NextResponse.json({ path, signed_url: data.signedUrl, content_type: contentType });
}
export async function PUT(request) {
  if (!gleauxOwner(request) || !sameOrigin(request)) return NextResponse.json({ error: 'Owner access required.' }, { status: 403 });
  const db = getSupabaseAdmin();
  if (!db) return NextResponse.json({ error: 'Storage unavailable.' }, { status: 503 });
  const body = await request.json().catch(() => ({}));
  if (!['player', 'download'].includes(body.slot) || !validAudioPath(body.path, body.slot)) return NextResponse.json({ error: 'Invalid audio path.' }, { status: 400 });
  const name = body.path.split('/')[1];
  const { data, error } = await db.storage.from(GLEAUX_BUCKET).list(body.slot, { search: name, limit: 10 });
  const uploaded = data?.find(item => item.name === name);
  if (error || !uploaded || !uploaded.metadata?.size || uploaded.metadata.size > MAX_AUDIO_BYTES) return NextResponse.json({ error: 'Upload is missing or invalid. Please retry.' }, { status: 400 });
  const saved = await db.from('gleaux_settings').update({ [`${body.slot}_path`]: body.path, updated_at: new Date().toISOString() }).eq('id', 1);
  if (saved.error) return NextResponse.json({ error: 'Could not activate audio. Please retry.' }, { status: 500 });
  return NextResponse.json({ ok: true, path: body.path });
}
