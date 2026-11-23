import Link from 'next/link';
import YLShell from '../../components/yourlocal/YLShell';
import { joinPath, isSignupOpen } from '../../lib/community';
import { MEMBER_TYPES } from '../../lib/community-rules.mjs';
import { getBandsByEra, getPublishedArtists, getPublishedLocalBusinesses, getPublishedPodcasts } from '../../lib/content';

// Staging home for YourLocalReverb.com. When the domain moves, this page
// becomes the site's front door. Kept out of search engines until launch.
export const metadata = {
  title: 'YourLocalReverb | Support local, everywhere',
  description: 'A free community for local businesses, artists, bands, podcasts and bloggers across the US.',
  robots: { index: false, follow: false },
};
export const dynamic = 'force-dynamic';

const STEPS = [
  { title: 'Make a free profile', text: 'Pick what you are, add your city and ZIP. No password to remember.' },
  { title: 'Share your work', text: 'Upload up to 3 songs, 2 videos and your best photos. Your files stay in your own space.' },
  { title: 'Get found nearby', text: 'Neighbors browse by town to find the businesses, bands and creators around them.' },
];

export default async function YourLocalLandingPage() {
  const [bands, artists, businesses, podcasts, legends] = await Promise.all([
    getBandsByEra('scene'),
    getPublishedArtists(),
    getPublishedLocalBusinesses(),
    getPublishedPodcasts(),
    getBandsByEra('archive'),
  ]);
  const open = isSignupOpen();

  const sections = [
    { label: 'Bands', href: '/your-local-scene', count: bands.length },
    { label: 'Artists', href: '/your-local-artists', count: artists.length },
    { label: 'Businesses', href: '/your-local-business', count: businesses.length },
    { label: 'Podcasts', href: '/podcast', count: podcasts.length },
    { label: 'Blogs', href: '/your-local-blog', count: null },
    { label: 'Local Legends', href: '/local-legends-archive', count: legends.length },
  ];

  const spotlight = [
    ...bands.slice(0, 2).map((item) => ({ key: `b${item.id}`, href: `/bands/${item.slug}`, image: item.image_url, title: item.name, meta: item.genre || 'Band' })),
    ...artists.slice(0, 1).map((item) => ({ key: `a${item.id}`, href: `/bands/${item.slug}`, image: item.image_url, title: item.name, meta: item.genre || 'Artist' })),
    ...businesses.slice(0, 1).map((item) => ({ key: `s${item.id}`, href: '/your-local-business', image: item.logo_url, logo: true, title: item.name, meta: item.category || 'Business' })),
    ...podcasts.slice(0, 1).map((item) => ({ key: `p${item.id}`, href: `/podcast/${item.slug}`, image: item.cover_image_url, title: item.title, meta: 'Podcast' })),
  ].slice(0, 4);

  return (
    <YLShell>
      <section className="yl-landing-hero">
        <span className="yl-eyebrow">YourLocalReverb</span>
        <h1>Support local. Get found locally.</h1>
        <p className="yl-hero-sub">
          A free home for local businesses, bands, artists, podcasts and bloggers. Built for every town in the US.
        </p>
        <div className="yl-actions">
          <Link className="yl-btn yl-btn--primary" href="/your-local-scene">
            Explore local
          </Link>
          {open ? (
            <Link className="yl-btn" href={joinPath()}>
              Join free
            </Link>
          ) : (
            <span className="yl-soon">Free sign-ups open soon</span>
          )}
        </div>
      </section>

      <nav className="yl-explore" aria-label="Explore">
        {sections.map((section) => (
          <Link key={section.href} className="yl-explore-tile" href={section.href}>
            <strong>{section.label}</strong>
            <span>{section.count === null ? 'Read' : section.count ? `${section.count} listed` : 'Coming soon'}</span>
          </Link>
        ))}
      </nav>

      {spotlight.length ? (
        <section className="yl-section">
          <div className="yl-panel-head">
            <h2>On the scene now</h2>
            <Link className="yl-small" href="/your-local-scene">
              See all →
            </Link>
          </div>
          <div className="yl-grid">
            {spotlight.map((item) => (
              <Link key={item.key} className="yl-card" href={item.href}>
                <div className={`yl-card-media${item.logo ? ' yl-card-media--logo' : ''}`}>
                  {item.image ? <img src={item.image} alt="" loading="lazy" /> : <span className="yl-initials">{item.title.slice(0, 1)}</span>}
                </div>
                <div className="yl-card-body">
                  <span className="yl-card-meta">{item.meta}</span>
                  <h3>{item.title}</h3>
                </div>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <section className="yl-section">
        <h2 className="yl-section-title">How it works</h2>
        <ol className="yl-steps">
          {STEPS.map((step, index) => (
            <li key={step.title}>
              <span className="yl-step-num">{index + 1}</span>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="yl-section">
        <h2 className="yl-section-title">Who it's for</h2>
        <div className="yl-who">
          {MEMBER_TYPES.map((type) => (
            <div key={type.key} className="yl-who-item">
              <strong>{type.label}</strong>
              <span>{type.blurb}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="yl-cta">
        <div>
          <h2>{open ? 'Your town is waiting.' : 'Free sign-ups open soon.'}</h2>
          <p>{open ? 'Make your free profile in a minute.' : 'Browse the local scene now. Profiles for everyone are coming.'}</p>
        </div>
        <Link className="yl-btn yl-btn--primary" href={open ? joinPath() : '/your-local-scene'}>
          {open ? 'Join free' : 'Explore local'}
        </Link>
      </section>
    </YLShell>
  );
}
