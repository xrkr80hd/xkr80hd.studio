import { NextResponse } from 'next/server';
import { getProgressDb, getProgressPostShare, getProgressSettings, validPostId } from '../../../../../lib/progress';
import { PROGRESS_BUCKET, validPhotoPath } from '../../../../../lib/progress-validation.mjs';

export const dynamic = 'force-dynamic';

const BANNER = '/assets/progress/ashleys-progress-share.jpg';

// The preview picture for an update's share link: its first photo, or the page banner.
// Only served while the page is open to anyone with the link.
export async function GET(request, { params }) {
  const banner = () => NextResponse.redirect(new URL(BANNER, request.url), 302);
  if (!validPostId(params.id)) return banner();
  try {
    const settings = await getProgressSettings();
    if (settings.require_signin) return banner();
    const post = await getProgressPostShare(params.id);
    const path = post?.photo_paths?.[0];
    if (!path || !validPhotoPath(path)) return banner();
    const { data, error } = await getProgressDb().storage.from(PROGRESS_BUCKET).download(path);
    if (error || !data) return banner();
    return new NextResponse(await data.arrayBuffer(), {
      headers: {
        'Content-Type': data.type || 'image/jpeg',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
        'X-Robots-Tag': 'noindex',
      },
    });
  } catch {
    return banner();
  }
}
