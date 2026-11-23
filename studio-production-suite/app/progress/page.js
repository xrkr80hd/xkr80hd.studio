import ProgressView from './progress-view';

const SHARE_IMAGE = { url: 'https://xrkr80hd.studio/assets/progress/ashleys-progress-share.jpg', width: 1200, height: 675, type: 'image/jpeg', alt: "Ashley's Progress" };

export const metadata = {
  title: "Ashley's Progress",
  description: 'Updates for family and friends. Check back any time.',
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
  openGraph: { title: "Ashley's Progress", description: 'Updates for family and friends. Check back any time.', url: 'https://xrkr80hd.studio/progress', type: 'website', images: [SHARE_IMAGE] },
  twitter: { card: 'summary_large_image', title: "Ashley's Progress", description: 'Updates for family and friends. Check back any time.', images: [SHARE_IMAGE.url] },
};

export const dynamic = 'force-dynamic';

export default function ProgressPage({ searchParams }) {
  return <ProgressView searchParams={searchParams} />;
}
