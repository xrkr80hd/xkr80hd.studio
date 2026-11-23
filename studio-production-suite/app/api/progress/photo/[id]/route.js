import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getFamilyMember, getProgressDb, getProgressPostShare, getProgressSettings, isOwnerCookies, validPostId } from '../../../../../lib/progress';
import { PROGRESS_BUCKET, validPhotoPath } from '../../../../../lib/progress-validation.mjs';
import { cleanJpeg } from '../../../../../lib/jpeg-clean.mjs';

export const dynamic = 'force-dynamic';

const BANNER = '/assets/progress/ashleys-progress-share.jpg';

// Serves an update's photo with camera details (like location) removed.
// ?p=<path> picks a photo of that update; with no ?p it is the first photo, used as the
// share-link preview, and falls back to the page banner.
export async function GET(request, { params }) {
  const wanted = new URL(request.url).searchParams.get('p') || '';
  const preview = !wanted;
  const fallback = () => (preview ? NextResponse.redirect(new URL(BANNER, request.url), 302) : new NextResponse('Not found', { status: 404 }));
  if (!validPostId(params.id)) return fallback();
  try {
    const settings = await getProgressSettings();
    let isPrivate = false;
    if (settings.require_signin) {
      if (preview) return fallback();
      const jar = cookies();
      const allowed = isOwnerCookies(jar) || Boolean(await getFamilyMember(jar).catch(() => null));
      if (!allowed) return fallback();
      isPrivate = true;
    }
    const post = await getProgressPostShare(params.id);
    const paths = post?.photo_paths || [];
    const path = preview ? paths[0] : paths.find(item => item === wanted);
    if (!path || !validPhotoPath(path)) return fallback();
    const { data, error } = await getProgressDb().storage.from(PROGRESS_BUCKET).download(path);
    if (error || !data) return fallback();
    const type = data.type || 'image/jpeg';
    const raw = new Uint8Array(await data.arrayBuffer());
    const body = type === 'image/jpeg' ? cleanJpeg(raw) : raw;
    return new NextResponse(body, {
      headers: {
        'Content-Type': type,
        'Cache-Control': isPrivate ? 'private, max-age=3600' : 'public, max-age=3600, s-maxage=3600',
        'X-Robots-Tag': 'noindex',
      },
    });
  } catch {
    return fallback();
  }
}
