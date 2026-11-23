import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import AdminTracksManager from '../../../components/AdminTracksManager';
import { ADMIN_SESSION_USER_COOKIE, isOwnerUsername, ADMIN_SESSION_COOKIE, getAdminSessionUser } from '../../../lib/admin-auth';
import { getTracksForAdmin } from '../../../lib/content';

export const metadata = {
  title: 'XRKR Hub Tracks | xrkr80hd Studio',
};

export default async function AdminTracksPage() {
  const actingUser = getAdminSessionUser(cookies().get(ADMIN_SESSION_COOKIE)?.value) || '';
  if (!isOwnerUsername(actingUser)) {
    redirect('/admin');
  }

  const tracks = await getTracksForAdmin();

  return (
    <>
      <section className="card hero">
        <h1>XRKR Hub Tracks</h1>
        <p>Owner-only music library for your personal XRKR80HD Hub player.</p>
      </section>
      <AdminTracksManager initialTracks={tracks} />
    </>
  );
}
