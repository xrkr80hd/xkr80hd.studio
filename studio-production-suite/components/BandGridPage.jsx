import Link from 'next/link';
import YourLocalHeroNav from './YourLocalHeroNav';

export default function BandGridPage({ era, bands }) {
  return (
    <>
      <YourLocalHeroNav activeKey={era === 'archive' ? 'legends' : 'scene'} />

      <section className="section-space">
        <div className="band-grid" id="band-grid">
          {bands.length ? (
            bands.map((band) => (
              <Link key={band.id} href={`/bands/${band.slug}`} className="band-card" data-genre={String(band.genre || 'other').toLowerCase()}>
                <div className="band-card-image">
                  {band.image_url ? <img src={band.image_url} alt={band.name} /> : <span className="image-placeholder">[ Band Photo ]</span>}
                </div>
                <div className="band-card-content">
                  <div className="band-card-year">{band.years_active || 'Years Active'}</div>
                  <h3 className="band-card-name">{band.name}</h3>
                  <span className="band-card-genre">{band.genre || 'Local Band'}</span>
                  <p className="band-card-desc">{band.summary}</p>
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
