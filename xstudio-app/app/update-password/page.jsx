import { redirect } from 'next/navigation';
import PasswordResetForm from '../../components/PasswordResetForm';
import { requireOwner } from '../../lib/xstudio-server';
import { RECOVERY_COOKIE, verifyRecoveryGrant } from '../../lib/xstudio-recovery.mjs';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Set password | XSTUDIO', robots: { index: false, follow: false } };

export default async function UpdatePasswordPage() {
  const context = await requireOwner();
  if (context.response) redirect('/login');
  const claims = await context.client.auth.getClaims();
  const token = (await cookies()).get(RECOVERY_COOKIE)?.value;
  if (claims.error || !verifyRecoveryGrant(token, context.user.id, claims.data?.claims?.session_id)) redirect('/login?recovery=invalid');
  return <PasswordResetForm />;
}
