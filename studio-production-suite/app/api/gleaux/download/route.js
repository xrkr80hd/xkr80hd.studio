import { createHmac } from 'crypto';
import { NextResponse } from 'next/server';
import { GLEAUX_BUCKET, getGleauxSettings, getGleauxCount, sameOrigin } from '../../../../lib/gleaux';
import { getSupabaseAdmin } from '../../../../lib/supabase-admin';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export async function POST(request) {
  if (!sameOrigin(request)) return NextResponse.json({ error: 'Please download from the Gleaux page.' }, { status: 403 });
  const { request_id } = await request.json().catch(() => ({}));
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(request_id || '')) return NextResponse.json({ error: 'Invalid download request.' }, { status: 400 });
  try {
    const item = await getGleauxSettings();
    if (!item.downloads_enabled || !item.download_path) return NextResponse.json({ error: 'The download is not available yet.' }, { status: 404 });
    const db = getSupabaseAdmin();
    // Confirm the file exists before counting a download handoff.
    const name = item.download_path.split('/')[1];
    const files = await db.storage.from(GLEAUX_BUCKET).list('download', { search: name, limit: 10 });
    if (files.error || !files.data?.some(file => file.name === name)) throw new Error('Missing download');
    const ext = name.split('.').pop();
    const signed = await db.storage.from(GLEAUX_BUCKET).createSignedUrl(item.download_path, 120, { download: `Lets-Gleaux.${ext}` });
    if (signed.error) throw signed.error;
    const secret = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const minute = Math.floor(Date.now() / 60000);
    const visitor = `${request.headers.get('x-vercel-forwarded-for') || request.headers.get('x-forwarded-for') || 'local'}|${request.headers.get('user-agent') || ''}|${minute}`;
    const fingerprint = createHmac('sha256', secret).update(visitor).digest('hex');
    const logged = await db.from('gleaux_download_events').insert({ request_id, fingerprint, audio_path: item.download_path });
    if (logged.error && logged.error.code !== '23505') throw logged.error;
    return NextResponse.json({ url: signed.data.signedUrl, count: await getGleauxCount() }, { headers: { 'Cache-Control': 'no-store' } });
  } catch { return NextResponse.json({ error: 'Download temporarily unavailable. Please try again.' }, { status: 503 }); }
}
