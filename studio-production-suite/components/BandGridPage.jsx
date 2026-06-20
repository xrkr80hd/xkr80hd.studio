import Link from 'next/link';

export default function BandGridPage({ badge, headlineAccent, headlineRest, subtitle, era, bands }) {
  return (
    <>
      <section className="card hero band-hero">
        <span className="tag-badge">{badge}</span>
        <h1>
          <span className="hero-accent">{headlineAccent}</span> {headlineRest}
        </h1>
        <p>{subtitle}</p>
        <div className="actions">
          <Link className={`button ${era === 'archive' ? 'primary' : ''}`.trim()} href="/local-legends-archive">
            YourLocal Legends
          </Link>
          <Link className={`button ${era === 'scene' ? 'primary' : ''}`.trim()} href="/your-local-scene">
            YourLocal Scene
          </Link>
          <Link className="button" href="/your-local-artists">
            YourLocal Artists
          </Link>
          <Link className="button" href="/your-local-blog">
            YourLocal Blog
          </Link>
          <Link className="button" href="/podcast">
            YourLocal Podcast
          </Link>
          <Link className="button" href="/your-local-business">
            YourLocal Business
          </Link>
        </div>
      </section>

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
