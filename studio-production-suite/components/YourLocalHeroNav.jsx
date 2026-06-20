import Link from 'next/link';

const NAV_ITEMS = [
  { key: 'legends', label: 'Legends', href: '/local-legends-archive' },
  { key: 'scene', label: 'Scene', href: '/your-local-scene' },
  { key: 'artists', label: 'Artists', href: '/your-local-artists' },
  { key: 'business', label: 'Business', href: '/your-local-business' },
  { key: 'podcast', label: 'Podcast', href: '/podcast' },
  { key: 'blog', label: 'Blog', href: '/your-local-blog' },
];

const SUBTITLES = {
  legends: 'Legendary local bands that shaped the scene — no longer active, never forgotten.',
  scene: 'Current local bands actively writing, releasing, and performing now.',
  artists: 'Solo artists in the local community with dedicated profiles and galleries.',
  business: 'Local businesses we support across services, production, food, and the community.',
  podcast: 'Local podcast profiles. Open each to hear the latest drops.',
  blog: 'News, stories, and updates from artists, businesses, and creators around the scene.',
};

export default function YourLocalHeroNav({ activeKey = '' }) {
  const activeItem = NAV_ITEMS.find((i) => i.key === activeKey);
  const subtitle = SUBTITLES[activeKey] || 'Explore everything local.';
  const visibleItems = NAV_ITEMS.filter((i) => i.key !== activeKey);

  return (
    <section className="card hero yourlocal-unified-hero">
      <nav className="yourlocal-breadcrumb" aria-label="YourLocal breadcrumb">
        <Link href="/" className="yourlocal-breadcrumb-link">Home</Link>
        <span className="yourlocal-breadcrumb-sep" aria-hidden="true">/</span>
        <span className="yourlocal-breadcrumb-current">YourLocal {activeItem?.label || ''}</span>
      </nav>

      <h1 className="yourlocal-hero-heading">
        <span className="hero-accent">YourLocal</span>
        {activeItem ? ` ${activeItem.label}` : ''}
      </h1>
      <p className="yourlocal-hero-subtitle">{subtitle}</p>

      <nav className="yourlocal-hero-nav-wrap" aria-label="YourLocal section navigation">
        <span className="yourlocal-hero-nav-title">Explore</span>
        <div className="yourlocal-hero-nav">
          {visibleItems.map((item) => (
            <Link
              key={item.key}
              className="button yourlocal-hero-link"
              href={item.href}
              prefetch={false}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </nav>
    </section>
  );
}
