import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import AdminHomeSettingsForm from '../../../components/AdminHomeSettingsForm';
import { ADMIN_SESSION_USER_COOKIE, isOwnerUsername, ADMIN_SESSION_COOKIE, getAdminSessionUser } from '../../../lib/admin-auth';
import { getSiteProfile } from '../../../lib/content';

export const metadata = {
  title: 'Homepage Controls | xrkr80hd Studio',
};

export default async function AdminHomeSettingsPage() {
  const actingUser = getAdminSessionUser(cookies().get(ADMIN_SESSION_COOKIE)?.value) || '';
  if (!isOwnerUsername(actingUser)) {
    redirect('/admin');
  }

  const profile = await getSiteProfile();

  return (
    <>
      <section className="card hero">
        <h1>Homepage Controls</h1>
        <p>Owner-only controls for homepage messaging, landing profile, and front-page card images.</p>
      </section>
      <AdminHomeSettingsForm initialProfile={profile} />
    </>
  );
}
