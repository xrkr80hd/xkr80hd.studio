import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { ADMIN_SESSION_USER_COOKIE, isOwnerUsername } from '../../../../lib/admin-auth';
import { getSupabaseAdmin } from '../../../../lib/supabase-admin';

export const runtime = 'nodejs';

function requireOwner() {
  const actingUser = cookies().get(ADMIN_SESSION_USER_COOKIE)?.value || '';
  if (!isOwnerUsername(actingUser)) {
    return NextResponse.json({ error: 'Owner only.' }, { status: 403 });
  }
  return null;
}

export async function GET(request) {
  const denied = requireOwner();
  if (denied) return denied;

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ error: 'Missing server credentials.' }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const filterType = searchParams.get('type') || '';

  let query = supabase
    .from('projects')
    .select('id, title, summary, body, project_url, created_at')
    .ilike('body', '%public_submission%')
    .order('id', { ascending: false });

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const submissions = (data || []).map((row) => {
    let parsed = {};
    try {
      parsed = JSON.parse(row.body || '{}');
    } catch {
      // leave empty
    }
    return {
      id: row.id,
      title: row.title,
      submit_type: parsed.submit_type || 'other',
      name: parsed.name || '',
      contact_name: parsed.contact_name || '',
      contact_email: parsed.contact_email || '',
      city: parsed.city || '',
      summary: parsed.summary || row.summary || '',
      details: parsed.details || '',
      links: Array.isArray(parsed.links) ? parsed.links : [],
      files: Array.isArray(parsed.files) ? parsed.files : [],
      submitted_at: parsed.submitted_at || row.created_at || '',
    };
  }).filter((s) => !filterType || s.submit_type === filterType);

  return NextResponse.json({ submissions });
}

export async function DELETE(request) {
  const denied = requireOwner();
  if (denied) return denied;

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ error: 'Missing server credentials.' }, { status: 500 });
  }

  const body = await request.json().catch(() => ({}));
  const id = Number(body.id);
  if (!id) {
    return NextResponse.json({ error: 'Invalid id.' }, { status: 400 });
  }

  const { error } = await supabase.from('projects').delete().eq('id', id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
