import Link from 'next/link';
import { isSignupOpen } from '../../lib/community';
import { getHiddenPaths } from '../../lib/page-visibility';
import YLShell from './YLShell';

export const YL_SECTIONS = [
  { key: 'scene', label: 'Bands', href: '/your-local-scene' },
  { key: 'artists', label: 'Artists', href: '/your-local-artists' },
  { key: 'business', label: 'Businesses', href: '/your-local-business' },
  { key: 'podcast', label: 'Podcasts', href: '/podcast' },
  { key: 'blog', label: 'Blogs', href: '/your-local-blog' },
  { key: 'legends', label: 'Local Legends', href: '/local-legends-archive' },
];

function initials(value) {
  const parts = String(value || '').split(/\s+/).filter(Boolean).slice(0, 2);
  return parts.length ? parts.map((part) => part[0]?.toUpperCase() || '').join('') : 'YL';
}

function controlHref(sort, category) {
  const params = new URLSearchParams();
  if (sort && sort !== 'az') params.set('sort', sort);
  if (category && category !== 'all') params.set('category', category);
  const query = params.toString();
  return query ? `?${query}` : '?';
}

function Card({ item }) {
  const media = (
    <div className={`yl-card-media${item.logo ? ' yl-card-media--logo' : ''}`}>
      {item.image ? <img src={item.image} alt="" loading="lazy" /> : <span className="yl-initials">{initials(item.title)}</span>}
    </div>
  );
  const body = (
    <div className="yl-card-body">
      {item.meta ? <span className="yl-card-meta">{item.meta}</span> : null}
      <h3>{item.title}</h3>
      {item.sub ? <span className="yl-card-sub">{item.sub}</span> : null}
      {item.text ? <p className="yl-card-text">{item.text}</p> : null}
      {item.cta ? <span className="yl-card-cta">{item.cta} →</span> : null}
    </div>
  );

  if (item.href && item.external) {
    return (
      <a className="yl-card" href={item.href} target="_blank" rel="noreferrer">
        {media}
        {body}
      </a>
    );
  }
  if (item.href) {
    return (
      <Link className="yl-card" href={item.href}>
        {media}
        {body}
      </Link>
    );
  }
  return (
    <article className="yl-card">
      {media}
      {body}
    </article>
  );
}

// One clean directory layout shared by Bands, Artists, Businesses, Podcasts and Legends.
export default async function YLDirectory({
  sectionKey,
  eyebrow = 'YourLocal',
  title,
  subtitle,
  items = [],
  totalCount = 0,
  categories = [],
  sort = 'az',
  category = 'all',
  emptyText = 'Nothing here yet.',
  joinPrompt = null,
}) {
  const hidden = new Set(await getHiddenPaths().catch(() => []));
  const tabs = YL_SECTIONS.filter((section) => section.key === sectionKey || !hidden.has(section.href));

  return (
    <YLShell>
      <nav className="yl-tabs" aria-label="YourLocal sections">
        {tabs.map((section) => (
          <Link key={section.key} className="yl-tab" href={section.href} aria-current={section.key === sectionKey ? 'page' : undefined}>
            {section.label}
          </Link>
        ))}
      </nav>

      <header className="yl-hero">
        <span className="yl-eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        {subtitle ? <p className="yl-hero-sub">{subtitle}</p> : null}
      </header>

      {totalCount ? (
        <div className="yl-filters">
          <div className="yl-chips" aria-label="Filter by category">
            <Link className="yl-chip" href={controlHref(sort, 'all')} aria-current={category === 'all' ? 'true' : undefined}>
              All
            </Link>
            {categories.map((name) => (
              <Link key={name} className="yl-chip" href={controlHref(sort, name)} aria-current={category === name ? 'true' : undefined}>
                {name}
              </Link>
            ))}
          </div>
          <div className="yl-sort" aria-label="Sort">
            <span>Sort</span>
            <Link href={controlHref('az', category)} aria-current={sort === 'az' ? 'true' : undefined}>A–Z</Link>
            <Link href={controlHref('za', category)} aria-current={sort === 'za' ? 'true' : undefined}>Z–A</Link>
            <Link href={controlHref('category', category)} aria-current={sort === 'category' ? 'true' : undefined}>Category</Link>
          </div>
        </div>
      ) : null}

      <div className="yl-grid">
        {items.length ? items.map((item) => <Card key={item.key} item={item} />) : <p className="yl-empty">{totalCount ? 'Nothing matches that category.' : emptyText}</p>}
      </div>

      {joinPrompt && isSignupOpen() ? (
        <section className="yl-cta">
          <div>
            <h2>{joinPrompt.title}</h2>
            <p>{joinPrompt.text}</p>
          </div>
          <Link className="yl-btn yl-btn--primary" href={joinPrompt.href || '/join'}>
            Join free
          </Link>
        </section>
      ) : null}
    </YLShell>
  );
}

export function readDirectoryControls(searchParams = {}) {
  const sort = ['az', 'za', 'category'].includes(searchParams.sort) ? searchParams.sort : 'az';
  const category = String(searchParams.category || 'all').trim() || 'all';
  return { sort, category };
}
