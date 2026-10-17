import StudioDashboard from '../components/StudioDashboard';
import productionContract from '../xstudio-core/references/contract.json';
import { redirect } from 'next/navigation';
import { requireOwner } from '../lib/xstudio-server';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const context = await requireOwner();
  if (context.response) redirect('/login');
  return <StudioDashboard productionContract={{
    views: productionContract.views,
    modes: productionContract.modes,
    voiceLimit: productionContract.voice_limit,
  }} providerAvailability={{
    gemini: Boolean(process.env.GEMINI_API_KEY),
    grok: Boolean(process.env.XAI_API_KEY),
  }} />;
}
