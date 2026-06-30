import Link from 'next/link';
import PublicDirectoryControls from '../../components/PublicDirectoryControls';
import YourLocalHeroNav from '../../components/YourLocalHeroNav';
import { filterAndSortPublicListings, getPublicListingCategories } from '../../lib/public-directory-listing.mjs';
import { getPublishedArtists } from '../../lib/content';

export default async function YourLocalArtistsPage({ searchParams = {} }) {
  const artists = await getPublishedArtists();
  const sort = ['az', 'za', 'category'].includes(searchParams.sort) ? searchParams.sort : 'az';
  const category = String(searchParams.category || 'all').trim() || 'all';
  const listingOptions = {
    getName: (artist) => artist.name,
    getCategory: (artist) => artist.genre || 'Solo Artist',
  };
  const categories = getPublicListingCategories(artists, listingOptions);
  const visibleArtists = filterAndSortPublicListings(artists, { ...listingOptions, sort, category });

  return (
    <>
      <YourLocalHeroNav activeKey="artists" />

      <section className="section-space">
        <PublicDirectoryControls sort={sort} category={category} categories={categories} label="Sort and filter local artists" />
        <div className="band-grid public-listing-grid">
          {visibleArtists.length ? (
            visibleArtists.map((artist) => {
              const gallery = Array.isArray(artist.gallery_images) ? artist.gallery_images.slice(0, 6) : [];

              return (
                <article key={artist.id} className="public-listing-card public-listing-card--square band-card artist-card">
                  <div className="public-listing-card-media band-card-image">
                    {artist.image_url ? <img src={artist.image_url} alt={artist.name} /> : <span className="image-placeholder">[ Artist Photo ]</span>}
                  </div>
                  <div className="public-listing-card-content band-card-content">
                    <h3 className="band-card-name">{artist.name}</h3>
                    <div className="band-card-year">{artist.years_active || 'Active Years'}</div>
                    <span className="band-card-genre">{artist.genre || 'Solo Artist'}</span>
                    {artist.summary ? <p className="band-card-desc public-listing-card-description">{artist.summary}</p> : null}

                    <div className="artist-gallery-wrap">
                      <div className="artist-gallery-title">Artist Gallery</div>
                      {gallery.length ? (
                        <div className="artist-gallery-grid">
                          {gallery.map((imageUrl, index) => (
                            <a key={`${artist.id}-gallery-${index}`} href={imageUrl} target="_blank" rel="noreferrer" className="artist-gallery-item">
                              <img src={imageUrl} alt={`${artist.name} gallery ${index + 1}`} />
                            </a>
                          ))}
                        </div>
                      ) : (
                        <p className="meta">No gallery photos uploaded yet.</p>
                      )}
                    </div>

                    <div className="actions">
                      <Link className="button primary" href={`/bands/${artist.slug}`}>
                        Open Artist Profile
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })
          ) : (
            <article className="card">
              <p className="meta">{artists.length ? 'No artists match this category.' : 'No solo artists are published yet.'}</p>
            </article>
          )}
        </div>
      </section>
    </>
  );
}
