import { randomUUID } from 'crypto';
import { NextResponse } from 'next/server';
import { progressOwner, sameOrigin, getProgressDb, PROGRESS_BUCKET } from '../../../../../lib/progress';
import { MAX_PHOTO_BYTES, photoType, safePhotoName } from '../../../../../lib/progress-validation.mjs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Step 1 of a photo upload: hand the browser a one-time signed URL so the file goes straight to storage.
export async function POST(request) {
  if (!progressOwner(request) || !sameOrigin(request)) return NextResponse.json({ error: 'Owner access required.' }, { status: 403 });
  const db = getProgressDb();
  if (!db) return NextResponse.json({ error: 'Storage unavailable.' }, { status: 503 });
  const body = await request.json().catch(() => ({}));
  const filename = safePhotoName(body.filename);
  const contentType = photoType(filename);
  if (!contentType) return NextResponse.json({ error: 'Choose a JPG, PNG, WEBP or GIF photo.' }, { status: 400 });
  if (!Number.isFinite(body.size) || body.size <= 0 || body.size > MAX_PHOTO_BYTES) return NextResponse.json({ error: 'Each photo can be up to 20 MB.' }, { status: 400 });
  const path = `posts/${randomUUID()}-${filename}`;
  const { data, error } = await db.storage.from(PROGRESS_BUCKET).createSignedUploadUrl(path);
  if (error) return NextResponse.json({ error: 'Could not start the upload.' }, { status: 500 });
  return NextResponse.json({ path, signed_url: data.signedUrl, content_type: contentType });
}
