import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import AdminProgressPanel from '../../../components/AdminProgressPanel';
import { ADMIN_SESSION_COOKIE, ADMIN_SESSION_USER_COOKIE, isAdminSessionValid, isOwnerUsername } from '../../../lib/admin-auth';
import { listProgressPosts } from '../../../lib/progress';

export const metadata = { title: 'Progress Admin | xrkr80hd Studio', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

export default async function AdminProgressPage() {
  const jar = cookies();
  if (!isAdminSessionValid(jar.get(ADMIN_SESSION_COOKIE)?.value) || !isOwnerUsername(jar.get(ADMIN_SESSION_USER_COOKIE)?.value)) redirect('/admin/login?next=/admin/progress');
  try {
    return <AdminProgressPanel initialItems={await listProgressPosts()} />;
  } catch {
    return <section className="card"><h1>Progress updates unavailable</h1><p>The updates database could not be reached. Please refresh in a moment.</p></section>;
  }
}
