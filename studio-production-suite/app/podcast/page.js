import Link from 'next/link';
import { getPodcastEpisodesForPodcast, getPublishedPodcasts } from '../../lib/content';
import { formatDate } from '../../lib/format';

export default async function PodcastPage() {
  const podcasts = await getPublishedPodcasts();
  const cards = await Promise.all(
    podcasts.map(async (podcast) => {
      const latest = await getPodcastEpisodesForPodcast(podcast.id, 1);
      return {
        podcast,
        latest: latest[0] || null,
      };
    })
  );

  return (
    <>
      <section className="card hero band-hero">
        <span className="tag-badge">Podcast Channel</span>
        <h1>
          <span className="hero-accent">YourLocal</span> Podcasts
        </h1>
        <p>Local podcast profiles. Open each page to hear the latest drops and learn who they are.</p>
        <div className="actions">
          <Link className="button" href="/local-legends-archive">
            YourLocal Legends
          </Link>
          <Link className="button" href="/your-local-scene">
            YourLocal Scene
          </Link>
          <Link className="button" href="/your-local-artists">
            YourLocal Artists
          </Link>
          <Link className="button" href="/your-local-blog">
            YourLocal Blog
          </Link>
          <Link className="button primary" href="/podcast">
            YourLocal Podcast
          </Link>
          <Link className="button" href="/your-local-business">
            YourLocal Business
          </Link>
        </div>
      </section>

      <section className="section-space">
        <div className="band-grid">
          {cards.length ? (
            cards.map(({ podcast, latest }) => (
              <article key={podcast.id} className="band-card podcast-card">
                <div className="band-card-image">
                  {podcast.cover_image_url ? (
                    <img src={podcast.cover_image_url} alt={`${podcast.title} cover`} />
                  ) : (
                    <span className="image-placeholder">[ Podcast Cover ]</span>
                  )}
                </div>
                <div className="band-card-content">
                  {latest?.published_at ? <div className="band-card-year">Latest: {formatDate(latest.published_at)}</div> : null}
                  <h3 className="band-card-name">{podcast.title}</h3>
                  <span className="band-card-genre">{podcast.topic || 'Local Podcast'}</span>
                  {podcast.hosts ? <p className="band-card-desc">Hosts: {podcast.hosts}</p> : null}
                  {podcast.summary ? <p className="band-card-desc">{podcast.summary}</p> : null}
                  {latest?.title ? <p className="band-card-desc">Current Episode: {latest.title}</p> : null}
                  <div className="actions">
                    <Link className="button primary" href={`/podcast/${podcast.slug}`}>
                      Open Podcast Page
                    </Link>
                  </div>
                </div>
              </article>
            ))
          ) : (
            <article className="card">
              <p className="meta">No podcasts yet.</p>
            </article>
          )}
        </div>
      </section>
    </>
  );
}
