import Link from 'next/link';
import YourLocalHeroNav from './YourLocalHeroNav';

export default function BandGridPage({ era, bands }) {
  return (
    <>
      <YourLocalHeroNav activeKey={era === 'archive' ? 'legends' : 'scene'} />

      <section className="section-space">
        <div className="band-grid public-listing-grid" id="band-grid">
          {bands.length ? (
            bands.map((band) => (
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
              <p className="meta">No bands published yet.</p>
            </article>
          )}
        </div>
      </section>
    </>
  );
}
