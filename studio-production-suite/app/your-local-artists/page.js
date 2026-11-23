import YLDirectory, { readDirectoryControls } from '../../components/yourlocal/YLDirectory';
import { filterAndSortPublicListings, getPublicListingCategories } from '../../lib/public-directory-listing.mjs';
import { getPublishedArtists } from '../../lib/content';

export default async function YourLocalArtistsPage({ searchParams = {} }) {
  const artists = await getPublishedArtists();
  const { sort, category } = readDirectoryControls(searchParams);
  const listingOptions = {
    getName: (artist) => artist.name,
    getCategory: (artist) => artist.genre || 'Solo Artist',
  };
  const categories = getPublicListingCategories(artists, listingOptions);
  const visibleArtists = filterAndSortPublicListings(artists, { ...listingOptions, sort, category });

  const items = visibleArtists.map((artist) => ({
    key: artist.id,
    href: `/bands/${artist.slug}`,
    image: artist.image_url || (Array.isArray(artist.gallery_images) ? artist.gallery_images[0] : ''),
    title: artist.name,
    meta: artist.genre || 'Solo Artist',
    sub: artist.years_active || '',
    text: artist.summary,
    cta: 'View artist',
  }));

  return (
    <YLDirectory
      sectionKey="artists"
      title="Local artists"
      subtitle="Solo musicians, visual artists and creators making work close to home."
      items={items}
      totalCount={artists.length}
      categories={categories}
      sort={sort}
      category={category}
      emptyText="No artists are listed yet."
      joinPrompt={{ title: 'Are you an artist?', text: 'Make a free profile, share your work and get found by people nearby.', href: '/join?type=artist' }}
    />
  );
}
