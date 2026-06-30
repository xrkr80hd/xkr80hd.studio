import Link from 'next/link';
import { filterAndSortPublicListings, getPublicListingCategories } from '../lib/public-directory-listing.mjs';
import PublicDirectoryControls from './PublicDirectoryControls';
import YourLocalHeroNav from './YourLocalHeroNav';

function normalizeControls(searchParams = {}) {
  const sort = ['az', 'za', 'category'].includes(searchParams.sort) ? searchParams.sort : 'az';
  const category = String(searchParams.category || 'all').trim() || 'all';
  return { sort, category };
}

export default function BandGridPage({ era, bands, searchParams = {} }) {
  const controls = normalizeControls(searchParams);
  const listingOptions = {
    getName: (band) => band.name,
    getCategory: (band) => band.genre || 'Local Band',
  };
  const categories = getPublicListingCategories(bands, listingOptions);
  const visibleBands = filterAndSortPublicListings(bands, { ...listingOptions, ...controls });

  return (
    <>
      <YourLocalHeroNav activeKey={era === 'archive' ? 'legends' : 'scene'} />

      <section className="section-space">
        <PublicDirectoryControls
          sort={controls.sort}
          category={controls.category}
          categories={categories}
          label={`Sort and filter ${era === 'archive' ? 'local legends' : 'local scene'}`}
        />
        <div className="band-grid public-listing-grid" id="band-grid">
          {visibleBands.length ? (
            visibleBands.map((band) => (
              <Link key={band.id} href={`/bands/${band.slug}`} className="public-listing-card public-listing-card--square band-card" data-genre={String(band.genre || 'other').toLowerCase()}>
                <div className="public-listing-card-media band-card-image">
                  {band.image_url ? <img src={band.image_url} alt={band.name} /> : <span className="image-placeholder">[ Band Photo ]</span>}
                </div>
                <div className="public-listing-card-content band-card-content">
                  <h3 className="band-card-name">{band.name}</h3>
                  <div className="band-card-year">{band.years_active || 'Years Active'}</div>
                  <span className="band-card-genre">{band.genre || 'Local Band'}</span>
                  <p className="band-card-desc public-listing-card-description">{band.summary}</p>
                  <div className="band-card-arrow">View Full Story</div>
                </div>
              </Link>
            ))
          ) : (
            <article className="card">
              <p className="meta">{bands.length ? 'No entries match this category.' : 'No bands published yet.'}</p>
            </article>
          )}
        </div>
      </section>
    </>
  );
}
