import Link from 'next/link';
import HomeBioModal from '../components/HomeBioModal';
import HomeBlogNotice from '../components/HomeBlogNotice';
import HomeTracksPlayer from '../components/HomeTracksPlayer';
import { getHomeTracks, getLatestPublishedPost, getSiteProfile } from '../lib/content';

function Headline({ value }) {
  const text = String(value || 'XRKR80HD');

  if (/xrkr80hd/i.test(text)) {
    const suffix = text.replace(/xrkr80hd/i, '').trim();

    return (
      <h1>
        <span className="split-cool">XRKR</span>
        <span className="split-80">80</span>
        <span className="split-cool">HD</span>
        {suffix ? ` ${suffix}` : ''}
      </h1>
    );
  }

  return <h1>{text}</h1>;
}

const guideCardDefaults = [
  {
    key: 'hub',
    title: 'XRKR80HDLocal Hub',
    body: 'Your all-in-one control room. Stream tracks, check visuals, watch clips, and catch updates from one page.',
    href: '/hub',
    cta: 'Open Hub',
    image: '/assets/cards/hub-card.png',
  },
  {
    key: 'legends',
    title: 'YourLocal Legends',
    body: 'An archive for influential local bands that are no longer actively writing, releasing, or performing.',
    href: '/local-legends-archive',
    cta: 'Open Legends',
    image: '/assets/cards/local-legends-card.png',
  },
  {
    key: 'scene',
    title: 'YourLocal Scene',
    body: 'The current movement: active bands, fresh releases, and artists still on stages now.',
    href: '/your-local-scene',
    cta: 'Open Scene',
    image: '/assets/cards/local-scene-card.png',
  },
  {
    key: 'artists',
    title: 'YourLocal Artists',
    body: 'Solo artists and creators actively releasing, posting, and performing in your local scene.',
    href: '/your-local-artists',
    cta: 'Open Artists',
    image: '/assets/cards/local-artists.png',
  },
  {
    key: 'blog',
    title: 'YourLocal Blog',
    body: 'Stories, releases, writeups, and local updates from the community.',
    href: '/your-local-blog',
    cta: 'Open Blog',
    image: '/assets/cards/local-blog.png',
  },
  {
    key: 'podcast',
    title: 'YourLocal Podcast',
    body: 'Conversations and stories from artists, producers, and creators in your local scene.',
    href: '/podcast',
    cta: 'Open Podcast',
    image: '/assets/cards/local-podcast-card.png',
  },
  {
    key: 'business',
    title: 'YourLocal Business',
    body: 'Local businesses we support across print, sound, repair, food, and media.',
    href: '/your-local-business',
    cta: 'Open Business',
    image: '/assets/cards/contact-card.png',
  },
  {
    key: 'contact',
    title: 'Contact',
    body: 'Want your band, solo project, or podcast featured? Send your links and profile details here.',
    href: '/contact',
    cta: 'Contact Page',
    image: '/assets/cards/contact-card.png',
  },
];

export default async function HomePage() {
  const [profile, homeTracks, latestPost] = await Promise.all([getSiteProfile(), getHomeTracks(12), getLatestPublishedPost()]);
  const welcomeMessage = String(profile?.welcome_message || 'Welcome to XRKR80HD Studio.').trim();
  const showNewTracksAlert = Boolean(profile?.home_new_tracks_alert_enabled);
  const guideCards = guideCardDefaults.map((card) => {
    if (card.key === 'hub' && profile?.home_hub_card_image_url) {
      return { ...card, image: profile.home_hub_card_image_url };
    }
    if (card.key === 'legends' && profile?.home_legends_card_image_url) {
      return { ...card, image: profile.home_legends_card_image_url };
    }
    if (card.key === 'scene' && profile?.home_scene_card_image_url) {
      return { ...card, image: profile.home_scene_card_image_url };
    }
    if (card.key === 'podcast' && profile?.home_podcast_card_image_url) {
      return { ...card, image: profile.home_podcast_card_image_url };
    }
    if (card.key === 'business' && profile?.home_business_card_image_url) {
      return { ...card, image: profile.home_business_card_image_url };
    }
    if (card.key === 'contact' && profile?.home_contact_card_image_url) {
      return { ...card, image: profile.home_contact_card_image_url };
    }
    return card;
  });

  return (
    <>
      <HomeBlogNotice latestPost={latestPost} message={profile?.blog_notice_message} />

      <section className="hero home-hero home-unboxed">
        <div className="home-hero-profile">
          <div className="home-hero-avatar">
            {profile?.avatar_url ? <img src={profile.avatar_url} alt="XRKR80HD avatar" /> : <span>XR</span>}
          </div>
          <div>
            {welcomeMessage ? <p className="home-welcome-message">{welcomeMessage}</p> : null}
            {showNewTracksAlert ? (
              <a className="home-track-alert-badge" href="#home-radio">
                <span className="home-track-alert-dot" aria-hidden="true" />
                New tracks uploaded!
              </a>
            ) : null}
            <Headline value={profile?.headline} />
            {profile?.short_bio ? <p>{profile.short_bio}</p> : null}
            {profile?.full_bio ? (
              <div className="actions home-bio-actions">
                <HomeBioModal fullBio={profile.full_bio} avatarUrl={profile?.avatar_url} headline={profile?.headline} />
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <section id="home-radio" className="section-space home-radio home-unboxed">
        <div className="home-player-head">
          <h3 className="section-title">XRKR Radio</h3>
          <span className="meta">Derived shuffle pool from published band + podcast audio</span>
        </div>
        <HomeTracksPlayer tracks={homeTracks} />
      </section>

      <section className="section-space home-guide home-unboxed">
        <h3 className="section-title">Site Guide</h3>
        <p className="meta">Quick jump into each page from the navbar.</p>
        <div className="home-page-flow">
          {guideCards.map((card) => (
            <article key={card.href} className="home-feature">
              <div className="home-feature-media" style={{ backgroundImage: `url('${card.image}')` }} />
              <div className="home-feature-copy">
                <h4>{card.title}</h4>
                <p>{card.body}</p>
                <Link className="button" href={card.href}>
                  {card.cta}
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
