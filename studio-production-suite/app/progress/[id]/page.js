import { notFound } from 'next/navigation';
import ProgressView from '../progress-view';
import { getProgressPostShare, getProgressSettings, validPostId } from '../../../lib/progress';

export const dynamic = 'force-dynamic';

const SITE = 'https://xrkr80hd.studio';
const BANNER = `${SITE}/assets/progress/ashleys-progress-share.jpg`;
const ROBOTS = { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } };

function excerpt(text, max = 150) {
  const clean = String(text || '').replace(/\s+/g, ' ').trim();
  return clean.length > max ? `${clean.slice(0, max - 1).trimEnd()}…` : clean;
}

// Each update's link shows its own title, text and first photo when shared in a text.
export async function generateMetadata({ params }) {
  const fallback = { title: "Ashley's Progress", description: 'Updates for family and friends. Check back any time.', robots: ROBOTS };
  if (!validPostId(params.id)) return fallback;
  const [post, settings] = await Promise.all([
    getProgressPostShare(params.id).catch(() => null),
    getProgressSettings().catch(() => ({ require_signin: false })),
  ]);
  if (!post || settings.require_signin) return fallback;
  const title = `Ashley's Progress · Update ${post.number}`;
  const description = excerpt(post.title || post.body) || 'Updates for family and friends.';
  const url = `${SITE}/progress/${post.id}`;
  const image = post.photo_paths?.length ? `${SITE}/api/progress/photo/${post.id}` : BANNER;
  return {
    title,
    description,
    robots: ROBOTS,
    openGraph: { title, description, url, type: 'article', siteName: "Ashley's Progress", images: [{ url: image, alt: title }] },
    twitter: { card: 'summary_large_image', title, description, images: [image] },
  };
}

export default function ProgressUpdatePage({ params, searchParams }) {
  if (!validPostId(params.id)) notFound();
  return <ProgressView searchParams={searchParams} focusId={params.id} />;
}
