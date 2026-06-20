import YourLocalHeroNav from '../../components/YourLocalHeroNav';
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

export default async function YourLocalBusinessPage() {
  const businesses = await getPublishedLocalBusinesses();

  return (
    <>
      <section className="card hero band-hero">
        <span className="tag-badge">Support Local</span>
        <h1>
          <span className="hero-accent">YourLocal</span> Business
        </h1>
        <p>Local businesses we support across services, production, food, and the community.</p>
        <YourLocalHeroNav activeKey="business" />
      </section>

      <section className="section-space">
        <div className="band-grid">
          {businesses.length ? (
            businesses.map((item) => (
              <article key={item.id} className="band-card">
                <div className="band-card-content">
                  <div className="business-logo-wrap">
                    {item.logo_url ? (
                      <img className="business-logo" src={item.logo_url} alt={`${item.name} logo`} />
                    ) : (
                      <div className="business-logo business-logo-fallback">{initials(item.name)}</div>
                    )}
                  </div>
                  <h3 className="band-card-name">{item.name}</h3>
                  {item.category ? <span className="band-card-genre">{item.category}</span> : null}
                  {item.summary ? <p className="band-card-desc">{item.summary}</p> : null}
                  {item.description ? <p className="meta">{item.description}</p> : null}
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
              <p className="meta">No local businesses are published yet.</p>
            </article>
          )}
        </div>
      </section>
    </>
  );
}
