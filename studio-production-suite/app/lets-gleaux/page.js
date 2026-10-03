import GleauxExperience from '../../components/GleauxExperience';
import { getGleauxSettings, getGleauxCount, GLEAUX_DEFAULTS } from '../../lib/gleaux';
export const metadata = {
  title: 'Lets Gleaux | A track for the fighters',
  description: 'Listen to Lets Gleaux and download the track for free. Inspired by the Gleaux for the Girls event, presented by Christus Cabrini and Walker Toyota.',
  openGraph: { title: 'Lets Gleaux — Turn it up. Stand together.', description: 'A free track inspired by the Gleaux for the Girls event, presented by Christus Cabrini and Walker Toyota.', images: ['/assets/gleaux/player-skin.png'] },
};
export const dynamic = 'force-dynamic';
export default async function GleauxPage() {
  let item = GLEAUX_DEFAULTS, count = null, unavailable = false;
  try { [item, count] = await Promise.all([getGleauxSettings(), getGleauxCount()]); } catch { unavailable = true; }
  return <GleauxExperience title={item.title} description={item.description} hasPlayer={!unavailable && Boolean(item.player_path)} hasDownload={!unavailable && item.downloads_enabled && Boolean(item.download_path)} initialCount={count} unavailable={unavailable} />;
}
