import YLDirectory from './yourlocal/YLDirectory';
import { filterAndSortPublicListings, getPublicListingCategories } from '../lib/public-directory-listing.mjs';

function normalizeControls(searchParams = {}) {
  const sort = ['az', 'za', 'category'].includes(searchParams.sort) ? searchParams.sort : 'az';
  const category = String(searchParams.category || 'all').trim() || 'all';
  return { sort, category };
}

const COPY = {
  scene: {
    title: 'Local bands',
    subtitle: 'Bands writing, releasing and playing out right now.',
    empty: 'No bands are listed yet.',
    join: { title: 'In a band?', text: 'Create a free profile, upload a few songs and videos, and get found by people nearby.', href: '/join?type=band' },
  },
  archive: {
    title: 'Local Legends',
    subtitle: 'Bands that shaped the scene. No longer active, never forgotten.',
    empty: 'No legends are listed yet.',
    join: null,
  },
};

export default function BandGridPage({ era, bands, searchParams = {} }) {
  const controls = normalizeControls(searchParams);
  const listingOptions = {
    getName: (band) => band.name,
    getCategory: (band) => band.genre || 'Local Band',
  };
  const categories = getPublicListingCategories(bands, listingOptions);
  const visibleBands = filterAndSortPublicListings(bands, { ...listingOptions, ...controls });
  const copy = COPY[era === 'archive' ? 'archive' : 'scene'];

  const items = visibleBands.map((band) => ({
    key: band.id,
    href: `/bands/${band.slug}`,
    image: band.image_url,
    title: band.name,
    meta: band.genre || 'Local Band',
    sub: band.years_active || '',
    text: band.summary,
    cta: era === 'archive' ? 'Read the story' : 'View band',
  }));

  return (
    <YLDirectory
      sectionKey={era === 'archive' ? 'legends' : 'scene'}
      title={copy.title}
      subtitle={copy.subtitle}
      items={items}
      totalCount={bands.length}
      categories={categories}
      sort={controls.sort}
      category={controls.category}
      emptyText={copy.empty}
      joinPrompt={copy.join}
    />
  );
}
