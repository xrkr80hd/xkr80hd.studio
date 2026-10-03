import { NextResponse } from 'next/server';
import { getGleauxDb, getGleauxSettings, sameOrigin } from '../../../../lib/gleaux';
export const dynamic = 'force-dynamic';
export async function POST(request) {
  if (!sameOrigin(request)) return NextResponse.json({ error: 'Invalid origin.' }, { status: 403 });
  const { request_id } = await request.json().catch(() => ({}));
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(request_id || '')) return NextResponse.json({ error: 'Invalid play request.' }, { status: 400 });
  try {
    const item = await getGleauxSettings();
    if (!item.player_path) return NextResponse.json({ error: 'Track unavailable.' }, { status: 404 });
    const { error } = await getGleauxDb().from('gleaux_play_events').insert({ request_id, audio_path: item.player_path });
    if (error && error.code !== '23505') throw error;
    return NextResponse.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } });
  } catch { return NextResponse.json({ error: 'Tracking unavailable.' }, { status: 503 }); }
}
