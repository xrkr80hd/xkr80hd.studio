import YLDirectory, { readDirectoryControls } from '../../components/yourlocal/YLDirectory';
import { filterAndSortBusinesses, getBusinessCategories } from '../../lib/business-listing.mjs';
import { getPublishedLocalBusinesses } from '../../lib/content';

export default async function YourLocalBusinessPage({ searchParams = {} }) {
  const businesses = await getPublishedLocalBusinesses();
  const { sort, category } = readDirectoryControls(searchParams);
  const categories = getBusinessCategories(businesses);
  const visibleBusinesses = filterAndSortBusinesses(businesses, { sort, category });

  const items = visibleBusinesses.map((item) => ({
    key: item.id,
    href: item.website_url || '',
    external: Boolean(item.website_url),
    image: item.logo_url,
    logo: Boolean(item.logo_url),
    title: item.name,
    meta: item.category || 'Local Business',
    text: item.summary || item.description,
    cta: item.website_url ? 'Visit website' : '',
  }));

  return (
    <YLDirectory
      sectionKey="business"
      title="Local businesses"
      subtitle="Shops, services, food and makers worth supporting in your community."
      items={items}
      totalCount={businesses.length}
      categories={categories}
      sort={sort}
      category={category}
      emptyText="No businesses are listed yet."
      joinPrompt={{ title: 'Own a local business?', text: 'List it free and let neighbors find you.', href: '/join?type=business' }}
    />
  );
}
