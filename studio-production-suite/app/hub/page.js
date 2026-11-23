import HubMediaGallery from '../../components/HubMediaGallery';
import HomeTracksPlayer from '../../components/HomeTracksPlayer';
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

      <section id="xrkr-radio" className="card section-space hub-player hub-radio">
        <div className="hub-player-head">
          <h3 className="section-title">XRKR80HD Tracks</h3>
          <span className="meta">{counts.tracks} total</span>
        </div>
        <HomeTracksPlayer tracks={tracks} showCover />
      </section>

      <HubMediaGallery photos={photos.slice(0, 8)} videos={videos.slice(0, 8)} />
    </>
  );
}
