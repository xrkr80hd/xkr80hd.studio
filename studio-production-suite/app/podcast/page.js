import YLDirectory from '../../components/yourlocal/YLDirectory';
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

  const items = visibleCards.map(({ podcast, latest }) => ({
    key: podcast.id,
    href: `/podcast/${podcast.slug}`,
    image: podcast.cover_image_url,
    title: podcast.title,
    meta: podcast.topic || 'Local Podcast',
    sub: [podcast.hosts ? `Hosted by ${podcast.hosts}` : '', latest?.published_at ? `Latest ${formatDate(latest.published_at)}` : ''].filter(Boolean).join(' · '),
    text: podcast.description || podcast.summary,
    cta: 'Listen',
  }));

  return (
    <YLDirectory
      sectionKey="podcast"
      title="Local podcasts"
      subtitle="Shows, interviews and audio stories from your area."
      items={items}
      totalCount={cards.length}
      categories={categories}
      sort={sort}
      category={category}
      emptyText="No podcasts are listed yet."
      joinPrompt={{ title: 'Host a podcast?', text: 'Create a free profile and share your latest episodes.', href: '/join?type=podcast' }}
    />
  );
}
