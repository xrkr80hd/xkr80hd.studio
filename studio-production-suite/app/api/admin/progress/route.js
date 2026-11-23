import { NextResponse } from 'next/server';
import { progressOwner, sameOrigin, getProgressDb, listProgressPosts, PROGRESS_BUCKET } from '../../../../lib/progress';
import { parseProgressPost } from '../../../../lib/progress-validation.mjs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const UUID_RE = /^[0-9a-f-]{36}$/;

function denied(request) {
  return !progressOwner(request) || !sameOrigin(request);
}

async function photosExist(db, paths) {
  for (const path of paths) {
    const name = path.split('/')[1];
    const { data, error } = await db.storage.from(PROGRESS_BUCKET).list('posts', { search: name, limit: 5 });
    if (error || !data?.some(item => item.name === name)) return false;
  }
  return true;
}

export async function GET(request) {
  if (!progressOwner(request)) return NextResponse.json({ error: 'Owner access required.' }, { status: 403 });
  try { return NextResponse.json({ items: await listProgressPosts() }); }
  catch { return NextResponse.json({ error: 'Could not load updates.' }, { status: 503 }); }
}

export async function POST(request) {
  if (denied(request)) return NextResponse.json({ error: 'Owner access required.' }, { status: 403 });
  let post;
  try { post = parseProgressPost(await request.json()); }
  catch (error) { return NextResponse.json({ error: error.message }, { status: 400 }); }
  const db = getProgressDb();
  if (!db) return NextResponse.json({ error: 'Storage unavailable.' }, { status: 503 });
  if (!(await photosExist(db, post.photo_paths))) return NextResponse.json({ error: 'A photo did not finish uploading. Please add it again.' }, { status: 400 });
  const { data, error } = await db.from('progress_posts').insert(post).select('id').single();
  if (error) return NextResponse.json({ error: 'The update could not be posted. Please retry.' }, { status: 500 });
  return NextResponse.json({ ok: true, id: data.id });
}

export async function PUT(request) {
  if (denied(request)) return NextResponse.json({ error: 'Owner access required.' }, { status: 403 });
  const raw = await request.json().catch(() => ({}));
  if (!UUID_RE.test(String(raw.id || ''))) return NextResponse.json({ error: 'Unknown update.' }, { status: 400 });
  let post;
  try { post = parseProgressPost(raw); }
  catch (error) { return NextResponse.json({ error: error.message }, { status: 400 }); }
  const db = getProgressDb();
  if (!db) return NextResponse.json({ error: 'Storage unavailable.' }, { status: 503 });
  const current = await db.from('progress_posts').select('photo_paths').eq('id', raw.id).single();
  if (current.error) return NextResponse.json({ error: 'Unknown update.' }, { status: 404 });
  const added = post.photo_paths.filter(path => !current.data.photo_paths.includes(path));
  if (!(await photosExist(db, added))) return NextResponse.json({ error: 'A photo did not finish uploading. Please add it again.' }, { status: 400 });
  const { error } = await db.from('progress_posts').update({ ...post, updated_at: new Date().toISOString() }).eq('id', raw.id);
  if (error) return NextResponse.json({ error: 'The update could not be saved. Please retry.' }, { status: 500 });
  const removed = current.data.photo_paths.filter(path => !post.photo_paths.includes(path));
  if (removed.length) await db.storage.from(PROGRESS_BUCKET).remove(removed);
  return NextResponse.json({ ok: true });
}

export async function DELETE(request) {
  if (denied(request)) return NextResponse.json({ error: 'Owner access required.' }, { status: 403 });
  const id = new URL(request.url).searchParams.get('id') || '';
  if (!UUID_RE.test(id)) return NextResponse.json({ error: 'Unknown update.' }, { status: 400 });
  const db = getProgressDb();
  if (!db) return NextResponse.json({ error: 'Storage unavailable.' }, { status: 503 });
  const { data, error } = await db.from('progress_posts').delete().eq('id', id).select('photo_paths').single();
  if (error) return NextResponse.json({ error: 'The update could not be deleted.' }, { status: 500 });
  if (data?.photo_paths?.length) await db.storage.from(PROGRESS_BUCKET).remove(data.photo_paths);
  return NextResponse.json({ ok: true });
}
