import Link from 'next/link';
import { notFound } from 'next/navigation';
import YourLocalHeroNav from '../../../components/YourLocalHeroNav';
import { getPodcastEpisodesForPodcast, getPublishedPodcastBySlug } from '../../../lib/content';
import { formatDate } from '../../../lib/format';

export default async function PodcastDetailPage({ params }) {
  const podcast = await getPublishedPodcastBySlug(params.slug);
  if (!podcast) {
    notFound();
  }

  const episodes = await getPodcastEpisodesForPodcast(podcast.id, 8);

  return (
    <>
      <section className="card hero band-hero">
        <span className="tag-badge">Podcast Profile</span>
        <h1>{podcast.title}</h1>
        {podcast.hosts ? <p>Hosts: {podcast.hosts}</p> : null}
        {podcast.summary ? <p>{podcast.summary}</p> : null}
        <YourLocalHeroNav activeKey="podcast" />
      </section>

      <section className="section-space">
        <article className="card">
          <h2 className="section-title">About</h2>
          <p>{podcast.description || 'No description yet.'}</p>
        </article>
      </section>

      <section className="section-space">
        <h2 className="section-title">Latest Episodes</h2>
        <p className="meta">Recommended: keep 1-2 episodes active per podcast.</p>
        <div className="band-grid">
          {episodes.length ? (
            episodes.map((episode) => (
              <article key={episode.id} className="band-card podcast-card">
                <div className="band-card-content">
                  <div className="band-card-year">{episode.published_at ? formatDate(episode.published_at) : 'Draft'}</div>
                  <h3 className="band-card-name">{episode.title}</h3>
                  {episode.summary ? <p className="band-card-desc">{episode.summary}</p> : null}
                  {!episode.summary && episode.description ? <p className="band-card-desc">{episode.description}</p> : null}
                  {episode.audio_url ? <audio controls preload="none" src={episode.audio_url} /> : null}
                </div>
              </article>
            ))
          ) : (
            <article className="card">
              <p className="meta">No episodes published yet.</p>
            </article>
          )}
        </div>
      </section>
    </>
  );
}
