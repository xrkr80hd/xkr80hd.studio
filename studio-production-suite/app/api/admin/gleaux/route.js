import { NextResponse } from 'next/server';
import { gleauxOwner, sameOrigin, getGleauxSettings, getGleauxCount, getGleauxPlayCount } from '../../../../lib/gleaux';
import { parseGleauxSettings } from '../../../../lib/gleaux-validation.mjs';
import { getSupabaseAdmin } from '../../../../lib/supabase-admin';
export const dynamic = 'force-dynamic';
export async function GET(request) {
  if (!gleauxOwner(request)) return NextResponse.json({ error: 'Owner access required.' }, { status: 403 });
  try { return NextResponse.json({ item: await getGleauxSettings(), count: await getGleauxCount(), playCount: await getGleauxPlayCount() }); }
  catch { return NextResponse.json({ error: 'Could not load Gleaux settings.' }, { status: 503 }); }
}
export async function PUT(request) {
  if (!gleauxOwner(request) || !sameOrigin(request)) return NextResponse.json({ error: 'Owner access required.' }, { status: 403 });
  let payload;
  try { payload = parseGleauxSettings(await request.json()); }
  catch (error) { return NextResponse.json({ error: error.message }, { status: 400 }); }
  const db = getSupabaseAdmin();
  if (!db) return NextResponse.json({ error: 'Storage unavailable.' }, { status: 503 });
  const { error } = await db.from('gleaux_settings').update({ ...payload, updated_at: new Date().toISOString() }).eq('id', 1);
  return error ? NextResponse.json({ error: 'Settings could not be saved.' }, { status: 500 }) : NextResponse.json({ ok: true });
}
