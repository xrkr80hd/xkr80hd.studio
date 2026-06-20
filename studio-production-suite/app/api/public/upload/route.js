import { randomUUID } from 'crypto';
import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '../../../../lib/supabase-admin';

export const runtime = 'nodejs';

const ALLOWED_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'audio/mpeg',
  'audio/wav',
  'audio/ogg',
  'audio/mp4',
  'audio/aac',
  'application/pdf',
]);

function safeName(value) {
  return String(value || 'upload.bin')
    .trim()
    .replace(/[^a-zA-Z0-9._-]/g, '-')
    .replace(/-+/g, '-');
}

function inferType(file) {
  const explicit = String(file?.type || '').trim();
  if (explicit) {
    return explicit;
  }
  const name = String(file?.name || '').toLowerCase();
  if (name.endsWith('.jpg') || name.endsWith('.jpeg')) return 'image/jpeg';
  if (name.endsWith('.png')) return 'image/png';
  if (name.endsWith('.webp')) return 'image/webp';
  if (name.endsWith('.gif')) return 'image/gif';
  if (name.endsWith('.mp3')) return 'audio/mpeg';
  if (name.endsWith('.wav')) return 'audio/wav';
  if (name.endsWith('.ogg')) return 'audio/ogg';
  if (name.endsWith('.m4a')) return 'audio/mp4';
  if (name.endsWith('.aac')) return 'audio/aac';
  if (name.endsWith('.pdf')) return 'application/pdf';
  return 'application/octet-stream';
}

export async function POST(request) {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ error: 'Missing Supabase server credentials.' }, { status: 500 });
  }

  const contentType = request.headers.get('content-type') || '';
  if (!contentType.includes('multipart/form-data')) {
    return NextResponse.json({ error: 'Content-Type must be multipart/form-data.' }, { status: 400 });
  }

  const formData = await request.formData();
  const file = formData.get('file');

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'No file uploaded.' }, { status: 400 });
  }

  const uploadType = inferType(file);
  if (!ALLOWED_TYPES.has(uploadType)) {
    return NextResponse.json({ error: 'Unsupported file type.' }, { status: 400 });
  }

  const maxBytes = 25 * 1024 * 1024;
  if (file.size > maxBytes) {
    return NextResponse.json({ error: 'File exceeds 25MB limit.' }, { status: 400 });
  }

  const bucket = process.env.SUPABASE_STORAGE_BUCKET || 'uploads';
  const key = `misc/submissions/${Date.now()}-${randomUUID()}-${safeName(file.name)}`;
  const bytes = Buffer.from(await file.arrayBuffer());

  const result = await supabase.storage.from(bucket).upload(key, bytes, {
    upsert: false,
    contentType: uploadType,
  });

  if (result.error) {
    return NextResponse.json({ error: result.error.message }, { status: 500 });
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(key);
  return NextResponse.json({ ok: true, key, url: data.publicUrl });
}
