import { NextResponse } from 'next/server';
import { emailConfigured, getProgressDb, getProgressSettings, progressOwner, sameOrigin } from '../../../../../lib/progress';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  if (!progressOwner(request)) return NextResponse.json({ error: 'Owner access required.' }, { status: 403 });
  try { return NextResponse.json({ item: await getProgressSettings(), emailReady: emailConfigured() }); }
  catch { return NextResponse.json({ error: 'Could not load settings.' }, { status: 503 }); }
}

export async function PUT(request) {
  if (!progressOwner(request) || !sameOrigin(request)) return NextResponse.json({ error: 'Owner access required.' }, { status: 403 });
  const raw = await request.json().catch(() => ({}));
  if (typeof raw.require_signin !== 'boolean') return NextResponse.json({ error: 'Invalid setting.' }, { status: 400 });
  const db = getProgressDb();
  if (!db) return NextResponse.json({ error: 'Storage unavailable.' }, { status: 503 });
  const { error } = await db.from('progress_settings').update({ require_signin: raw.require_signin, updated_at: new Date().toISOString() }).eq('id', 1);
  return error ? NextResponse.json({ error: 'Setting could not be saved.' }, { status: 500 }) : NextResponse.json({ ok: true });
}
