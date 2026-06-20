import HubMediaGallery from '../../components/HubMediaGallery';
import HubTracksPlayer from '../../components/HubTracksPlayer';
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
    </>
  );
}
