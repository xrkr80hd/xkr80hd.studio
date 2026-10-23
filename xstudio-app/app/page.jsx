import LocalWorkspace from '../components/LocalWorkspace';
import CinematicStudio from './CinematicStudio';
import { redirect } from 'next/navigation';
import { requireOwner } from '../lib/xstudio-server';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const context = await requireOwner();
  if (context.user?.id) {
    return <CinematicStudio ownerId={context.user.id} />;
  }
  if (context.response?.status === 503) {
    return <LocalWorkspace />;
  }
  redirect('/login');
}
