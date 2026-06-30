import BandGridPage from '../../components/BandGridPage';
import { getBandsByEra } from '../../lib/content';

export default async function YourLocalScenePage({ searchParams = {} }) {
  const bands = await getBandsByEra('scene');

  return (
    <BandGridPage
      badge="Current Scene"
      headlineAccent="YourLocal"
      headlineRest="Scene"
      subtitle="Current local bands that are actively writing, releasing, and performing now."
      era="scene"
      bands={bands}
      searchParams={searchParams}
    />
  );
}
