import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import JoinForm from '../../components/yourlocal/JoinForm';
import YLShell from '../../components/yourlocal/YLShell';
import { SIGNUP_TEST_PATH, getSignedInMember } from '../../lib/community';

// Unlisted test entrance for member sign-up while the public Join page is hidden.
// Not linked anywhere and kept out of search engines.
export const metadata = {
  title: 'YourLocal test sign-up',
  robots: { index: false, follow: false, nocache: true },
};
export const dynamic = 'force-dynamic';

export default async function YourLocalTestPage({ searchParams = {} }) {
  const { member } = await getSignedInMember(cookies());
  if (member) redirect('/account');
  const signIn = searchParams.mode === 'signin';

  return (
    <YLShell>
      <header className="yl-hero yl-narrow">
        <span className="yl-eyebrow">Test page · not public</span>
        <h1>{signIn ? 'Sign in' : 'Get found by people nearby'}</h1>
        <p className="yl-hero-sub">
          {signIn
            ? "Enter the email you joined with and we'll send you a sign-in link."
            : 'This is the hidden test version of member sign-up. Accounts made here are real and go into the new member tables.'}
        </p>
      </header>
      <JoinForm
        mode={signIn ? 'signin' : 'join'}
        initialType={String(searchParams.type || '')}
        joinHref={SIGNUP_TEST_PATH}
        signInHref={`${SIGNUP_TEST_PATH}?mode=signin`}
      />
    </YLShell>
  );
}
