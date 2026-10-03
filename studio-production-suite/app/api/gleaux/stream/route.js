import { NextResponse } from 'next/server';
import { GLEAUX_BUCKET, getGleauxSettings } from '../../../../lib/gleaux';
import { getSupabaseAdmin } from '../../../../lib/supabase-admin';
export const dynamic = 'force-dynamic';
export async function GET() {
  try {
    const settings = await getGleauxSettings();
    if (!settings.player_path) return NextResponse.json({ error: 'Track coming soon.' }, { status: 404 });
    const { data, error } = await getSupabaseAdmin().storage.from(GLEAUX_BUCKET).createSignedUrl(settings.player_path, 3600);
    if (error) throw error;
    return NextResponse.json({ url: data.signedUrl }, { headers: { 'Cache-Control': 'no-store' } });
  } catch { return NextResponse.json({ error: 'Playback is temporarily unavailable.' }, { status: 503 }); }
}
