import YourLocalHeroNav from '../../components/YourLocalHeroNav';
import { filterAndSortBusinesses, getBusinessCategories } from '../../lib/business-listing.mjs';
import { getPublishedLocalBusinesses } from '../../lib/content';

function initials(value) {
  const parts = String(value || '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);

  if (!parts.length) {
    return 'YL';
  }

  return parts.map((part) => part[0]?.toUpperCase() || '').join('');
}

export default async function YourLocalBusinessPage({ searchParams = {} }) {
  const businesses = await getPublishedLocalBusinesses();
  const sort = ['az', 'za', 'category'].includes(searchParams.sort) ? searchParams.sort : 'az';
  const category = String(searchParams.category || 'all').trim() || 'all';
  const categories = getBusinessCategories(businesses);
  const visibleBusinesses = filterAndSortBusinesses(businesses, { sort, category });

  return (
    <>
      <YourLocalHeroNav activeKey="business" />

      <section className="section-space">
        <form className="public-directory-controls" method="get" aria-label="Sort and filter local businesses">
          <label>
            Sort
            <select name="sort" defaultValue={sort}>
              <option value="az">A-Z</option>
              <option value="za">Z-A</option>
              <option value="category">Category</option>
            </select>
          </label>
          <label>
            Category
            <select name="category" defaultValue={category}>
              <option value="all">All categories</option>
              {categories.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>
          <button className="button" type="submit">Apply</button>
        </form>

        <div className="band-grid public-listing-grid">
          {visibleBusinesses.length ? (
            visibleBusinesses.map((item) => (
              <article key={item.id} className="public-listing-card public-listing-card--square band-card">
                <div className="public-listing-card-media business-logo-wrap">
                  {item.logo_url ? (
                    <img className="business-logo" src={item.logo_url} alt={`${item.name} logo`} />
                  ) : (
                    <div className="business-logo business-logo-fallback">{initials(item.name)}</div>
                  )}
                </div>
                <div className="public-listing-card-content band-card-content">
                  <h3 className="band-card-name">{item.name}</h3>
                  {item.category ? <span className="band-card-genre">{item.category}</span> : null}
                  {item.summary || item.description ? (
                    <p className="band-card-desc public-listing-card-description">{item.summary || item.description}</p>
                  ) : null}
                  <div className="actions">
                    {item.website_url ? (
                      <a className="button" href={item.website_url} target="_blank" rel="noreferrer">
                        Visit Site
                      </a>
                    ) : (
                      <span className="meta">Website link pending</span>
                    )}
                  </div>
                </div>
              </article>
            ))
          ) : (
            <article className="card">
              <p className="meta">{businesses.length ? 'No businesses match this category.' : 'No local businesses are published yet.'}</p>
            </article>
          )}
        </div>
      </section>
    </>
  );
}
