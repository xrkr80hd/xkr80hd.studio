import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import AdminGleauxPanel from '../../../components/AdminGleauxPanel';
import { ADMIN_SESSION_COOKIE, ADMIN_SESSION_USER_COOKIE, isAdminSessionValid, isOwnerUsername } from '../../../lib/admin-auth';
import { getGleauxSettings, getGleauxCount } from '../../../lib/gleaux';
export const metadata = { title: 'Lets Gleaux Admin | xrkr80hd Studio' };
export const dynamic = 'force-dynamic';
export default async function AdminGleauxPage() {
  const jar = cookies();
  if (!isAdminSessionValid(jar.get(ADMIN_SESSION_COOKIE)?.value) || !isOwnerUsername(jar.get(ADMIN_SESSION_USER_COOKIE)?.value)) redirect('/admin/login');
  try { const [item, count] = await Promise.all([getGleauxSettings(), getGleauxCount()]); return <AdminGleauxPanel initialItem={item} initialCount={count} />; }
  catch { return <section className="card"><h1>Gleaux settings unavailable</h1><p>The campaign database could not be reached. Please refresh in a moment.</p></section>; }
}
