import BandGridPage from '../../components/BandGridPage';
import { getBandsByEra } from '../../lib/content';

export default async function LocalLegendsArchivePage({ searchParams = {} }) {
  const bands = await getBandsByEra('archive');

  return (
    <BandGridPage
      badge="Archive Collection"
      headlineAccent="YourLocal"
      headlineRest="Legends"
      subtitle="Legendary local bands that are no longer actively writing, releasing, or performing."
      era="archive"
      bands={bands}
      searchParams={searchParams}
    />
  );
}
