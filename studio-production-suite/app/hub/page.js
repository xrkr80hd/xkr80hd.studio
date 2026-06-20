import HubMediaGallery from '../../components/HubMediaGallery';
import HubTracksPlayer from '../../components/HubTracksPlayer';
import Link from 'next/link';
import { getHubData } from '../../lib/content';

export default async function HubPage() {
  const { tracks, photos, videos, counts } = await getHubData();

  return (
    <>
      <section className="card hero">
        <h1>
          <span className="hero-accent">
            <span className="split-cool">XRKR</span>
            <span className="split-80">80</span>
            <span className="split-cool">HD</span>Local
          </span>{' '}
          Hub
        </h1>
        <p>Everything in one place for XRKR80HD: music, photos, videos, and media drops.</p>
      </section>

      <section className="card section-space hub-player">
        <div className="hub-player-head">
          <h3 className="section-title">XRKR80HD Tracks</h3>
          <span className="meta">{counts.tracks} total</span>
        </div>
        <HubTracksPlayer tracks={tracks} />
      </section>

      <HubMediaGallery photos={photos.slice(0, 8)} videos={videos.slice(0, 8)} />

      <section className="card section-space">
        <h3 className="section-title">Hub Track Manager</h3>
        <p className="meta">Need to add, edit, or delete Hub tracks? Open the full CRUD manager below.</p>
        <div className="actions">
          <Link className="button primary" href="/admin/tracks" prefetch={false}>
            Open Full CRUD Track Manager
          </Link>
        </div>
      </section>

      <section className="card section-space">
        <p className="meta">Hub media uploads are independent from blog channels and stay in XRKR80HD Hub media only.</p>
      </section>
    </>
  );
}
