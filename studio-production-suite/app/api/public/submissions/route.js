import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '../../../../lib/supabase-admin';

export const runtime = 'nodejs';

const ALLOWED_TYPES = ['band', 'podcast', 'local_business', 'legend', 'local_scene', 'artist', 'blog', 'other'];

function text(value, max = 240) {
  return String(value || '').trim().slice(0, max);
}

function list(value) {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.map((item) => String(item || '').trim()).filter(Boolean).slice(0, 12);
}

export async function POST(request) {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ error: 'Missing Supabase server credentials.' }, { status: 500 });
  }

  const body = await request.json().catch(() => ({}));

  const submitType = text(body.submit_type, 40).toLowerCase();
  const name = text(body.name, 160);
  const contactName = text(body.contact_name, 160);
  const contactEmail = text(body.contact_email, 200);
  const city = text(body.city, 120);
  const summary = text(body.summary, 320);
  const details = text(body.details, 5000);
  const links = list(body.links);
  const files = list(body.files);

  if (!ALLOWED_TYPES.includes(submitType)) {
    return NextResponse.json({ error: 'Invalid submission type.' }, { status: 400 });
  }

  if (!name || !contactEmail) {
    return NextResponse.json({ error: 'Name and contact email are required.' }, { status: 400 });
  }

  const title = `${submitType.replace(/_/g, ' ')} submission: ${name}`;
  const record = {
    source: 'public_submission',
    submit_type: submitType,
    name,
    contact_name: contactName,
    contact_email: contactEmail,
    city,
    summary,
    details,
    links,
    files,
    submitted_at: new Date().toISOString(),
  };

  const result = await supabase.from('projects').insert({
    title,
    summary: summary || `${name} submitted for YourLocal review`,
    body: JSON.stringify(record, null, 2),
    project_url: links[0] || null,
    repo_url: null,
    is_featured: false,
  });

  if (result.error) {
    return NextResponse.json({ error: result.error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
