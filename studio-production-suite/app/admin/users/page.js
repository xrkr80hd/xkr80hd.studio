import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import AdminUsersManager from '../../../components/AdminUsersManager';
import { ADMIN_SESSION_USER_COOKIE, getAdminOwnerUsername, getConfiguredAdminUsernames, isOwnerUsername } from '../../../lib/admin-auth';
import { adminUsersBootstrapSql, listAdminUsers, normalizeAdminUsername } from '../../../lib/admin-users';

export const metadata = {
  title: 'Admin Users | xrkr80hd Studio',
};

export default async function AdminUsersPage() {
  const actingUser = normalizeAdminUsername(cookies().get(ADMIN_SESSION_USER_COOKIE)?.value || '');
  const ownerUsername = getAdminOwnerUsername();

  if (!isOwnerUsername(actingUser)) {
    redirect('/admin');
  }

  const result = await listAdminUsers();

  return (
    <>
      <section className="card hero">
        <h1>Manage Users</h1>
        <p>Add blog users, review access categories, and manage login details from one owner-only screen.</p>
      </section>

      <AdminUsersManager
        initialUsers={result.users}
        missingTable={result.missingTable}
        initialError={result.error || ''}
        sqlSnippet={result.missingTable ? adminUsersBootstrapSql() : ''}
        ownerUsername={ownerUsername}
        configuredUsernames={getConfiguredAdminUsernames()}
      />
    </>
  );
}
