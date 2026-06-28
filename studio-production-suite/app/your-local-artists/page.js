import Link from 'next/link';
import YourLocalHeroNav from '../../components/YourLocalHeroNav';
import { getPublishedArtists } from '../../lib/content';

export default async function YourLocalArtistsPage() {
  const artists = await getPublishedArtists();

  return (
    <>
      <YourLocalHeroNav activeKey="artists" />

      <section className="section-space">
        <div className="band-grid public-listing-grid">
          {artists.length ? (
            artists.map((artist) => {
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
              <p className="meta">No solo artists are published yet.</p>
            </article>
          )}
        </div>
      </section>
    </>
  );
}
