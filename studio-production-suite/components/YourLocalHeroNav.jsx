import Link from 'next/link';

const NAV_ITEMS = [
  { key: 'legends', label: 'Legends', href: '/local-legends-archive' },
  { key: 'artists', label: 'Artists', href: '/your-local-artists' },
  { key: 'business', label: 'Business', href: '/your-local-business' },
  { key: 'podcast', label: 'Podcast', href: '/podcast' },
  { key: 'blog', label: 'Blog', href: '/your-local-blog' },
];

export default function YourLocalHeroNav({ activeKey = '' }) {
  return (
    <div className="yourlocal-hero-nav-wrap" aria-label="YourLocal section navigation">
      <div className="yourlocal-hero-nav-title">YourLocal</div>
      <div className="yourlocal-hero-nav">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.key}
            className={`button yourlocal-hero-link ${activeKey === item.key ? 'primary is-active' : ''}`.trim()}
            href={item.href}
          >
            {item.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
