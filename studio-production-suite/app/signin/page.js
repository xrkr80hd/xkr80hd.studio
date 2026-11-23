import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import JoinForm from '../../components/yourlocal/JoinForm';
import YLShell from '../../components/yourlocal/YLShell';
import { getSignedInMember } from '../../lib/community';

export const metadata = { title: 'Sign in | YourLocal' };
export const dynamic = 'force-dynamic';

export default async function SignInPage() {
  const { member } = await getSignedInMember(cookies());
  if (member) redirect('/account');

  return (
    <YLShell>
      <header className="yl-hero yl-narrow">
        <span className="yl-eyebrow">YourLocal</span>
        <h1>Sign in</h1>
        <p className="yl-hero-sub">Enter the email you joined with and we'll send you a sign-in link.</p>
      </header>
      <JoinForm mode="signin" />
    </YLShell>
  );
}
