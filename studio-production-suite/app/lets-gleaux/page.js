import GleauxExperience from '../../components/GleauxExperience';
import { getGleauxSettings, GLEAUX_DEFAULTS } from '../../lib/gleaux';
export const metadata = {
  title: 'Lets Gleaux | A track for the fighters',
  description: 'Listen to Lets Gleaux and download the track for free. Inspired by the Gleaux for the Girls event, presented by Christus Cabrini and Walker Toyota.',
  openGraph: { title: 'Lets Gleaux — Turn it up. Stand together.', description: 'A free track inspired by the Gleaux for the Girls event, presented by Christus Cabrini and Walker Toyota.', url: 'https://xrkr80hd.studio/lets-gleaux', type: 'website', images: [{ url: 'https://xrkr80hd.studio/assets/gleaux/share-artwork-v2.png', width: 1536, height: 1536, type: 'image/png', alt: 'Download Let’s Gleaux for free — Trav with his guitar, inspired by Gleaux for the Girls.' }] },
  twitter: { card: 'summary_large_image', title: 'Lets Gleaux — Turn it up. Stand together.', description: 'A free track inspired by the Gleaux for the Girls event, presented by Christus Cabrini and Walker Toyota.', images: ['https://xrkr80hd.studio/assets/gleaux/share-artwork-v2.png'] },
};
export const dynamic = 'force-dynamic';
export default async function GleauxPage() {
  let item = GLEAUX_DEFAULTS, unavailable = false;
  try { item = await getGleauxSettings(); } catch { unavailable = true; }
  return <GleauxExperience title={item.title} description={item.description} hasPlayer={!unavailable && Boolean(item.player_path)} hasDownload={!unavailable && item.downloads_enabled && Boolean(item.download_path)} unavailable={unavailable} />;
}
