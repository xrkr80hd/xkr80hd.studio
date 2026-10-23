import LocalWorkspace from '../components/LocalWorkspace';
import CinematicStudio from './CinematicStudio';
import { redirect } from 'next/navigation';
import { requireOwner, isSupabaseConfigured } from '../lib/xstudio-server';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const context = await requireOwner();
  if (context.user?.id) {
    return <CinematicStudio ownerId={context.user.id} />;
  }
  if (context.response?.status === 503) {
    return <LocalWorkspace />;
  }
  // In development preview or when running with Cloud SQL fallback, enter directly as verified owner
  if (process.env.NODE_ENV === 'development' || !isSupabaseConfigured()) {
    return <CinematicStudio ownerId="xrkr80hd@gmail.com" />;
  }
  redirect('/login');
}
