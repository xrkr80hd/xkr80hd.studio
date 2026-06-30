import Link from 'next/link';
import PublicDirectoryControls from '../../components/PublicDirectoryControls';
import YourLocalHeroNav from '../../components/YourLocalHeroNav';
import { getPodcastEpisodesForPodcast, getPublishedPodcasts } from '../../lib/content';
import { formatDate } from '../../lib/format';
import { filterAndSortPublicListings, getPublicListingCategories } from '../../lib/public-directory-listing.mjs';

export default async function PodcastPage({ searchParams = {} }) {
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
  const sort = ['az', 'za', 'category'].includes(searchParams.sort) ? searchParams.sort : 'az';
  const category = String(searchParams.category || 'all').trim() || 'all';
  const listingOptions = {
    getName: (card) => card.podcast.title,
    getCategory: (card) => card.podcast.topic || 'Local Podcast',
  };
  const categories = getPublicListingCategories(cards, listingOptions);
  const visibleCards = filterAndSortPublicListings(cards, { ...listingOptions, sort, category });

  return (
    <>
      <YourLocalHeroNav activeKey="podcast" />

      <section className="section-space">
        <PublicDirectoryControls sort={sort} category={category} categories={categories} label="Sort and filter podcasts" />
        <div className="band-grid public-listing-grid">
          {visibleCards.length ? (
            visibleCards.map(({ podcast, latest }) => (
              <article key={podcast.id} className="public-listing-card public-listing-card--square band-card podcast-card">
                <div className="public-listing-card-media band-card-image">
                  {podcast.cover_image_url ? (
                    <img src={podcast.cover_image_url} alt={`${podcast.title} cover`} />
                  ) : (
                    <span className="image-placeholder">[ Podcast Cover ]</span>
                  )}
                </div>
                <div className="public-listing-card-content band-card-content">
                  <h3 className="band-card-name">{podcast.title}</h3>
                  {latest?.published_at ? <div className="band-card-year">Latest: {formatDate(latest.published_at)}</div> : null}
                  <span className="band-card-genre">{podcast.topic || 'Local Podcast'}</span>
                  {podcast.hosts ? <p className="band-card-desc public-listing-card-secondary">Hosts: {podcast.hosts}</p> : null}
                  {podcast.description || podcast.summary ? (
                    <p className="band-card-desc public-listing-card-description">{podcast.description || podcast.summary}</p>
                  ) : null}
                  {latest?.title ? <p className="band-card-desc public-listing-card-secondary">Current Episode: {latest.title}</p> : null}
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
              <p className="meta">{cards.length ? 'No podcasts match this category.' : 'No podcasts yet.'}</p>
            </article>
          )}
        </div>
      </section>
    </>
  );
}
