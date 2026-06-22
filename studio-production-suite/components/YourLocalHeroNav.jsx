import Link from 'next/link';

const SECTION_LABELS = {
  legends: 'Legends',
  scene: 'Scene',
  artists: 'Artists',
  business: 'Business',
  podcast: 'Podcast',
  blog: 'Blog',
};

const SUBTITLES = {
  legends: 'Legendary local bands that shaped the scene — no longer active, never forgotten.',
  scene: 'Current local bands actively writing, releasing, and performing now.',
  artists: 'Solo artists in the local community with dedicated profiles and galleries.',
  business: 'Local businesses we support across services, production, food, and the community.',
  podcast: 'Local podcast profiles. Open each to hear the latest drops.',
  blog: 'News, stories, and updates from artists, businesses, and creators around the scene.',
};

export default function YourLocalHeroNav({ activeKey = '' }) {
  const activeLabel = SECTION_LABELS[activeKey] || '';
  const subtitle = SUBTITLES[activeKey] || 'Explore everything local.';

  return (
    <section className="card hero yourlocal-unified-hero">
      <nav className="yourlocal-breadcrumb" aria-label="YourLocal breadcrumb">
        <Link href="/" className="yourlocal-breadcrumb-link">Home</Link>
        <span className="yourlocal-breadcrumb-sep" aria-hidden="true">/</span>
        <span className="yourlocal-breadcrumb-current">
          <span className="brand-yourlocal"><span className="brand-your">Your</span><span className="brand-local">Local</span></span>
          {activeLabel ? ` ${activeLabel}` : ''}
        </span>
      </nav>

      <h1 className="yourlocal-hero-heading">
        <span className="brand-yourlocal"><span className="brand-your">Your</span><span className="brand-local">Local</span></span>
        {activeLabel ? ` ${activeLabel}` : ''}
      </h1>
      <p className="yourlocal-hero-subtitle">{subtitle}</p>
    </section>
  );
}
