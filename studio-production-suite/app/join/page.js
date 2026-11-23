import { cookies } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import JoinForm from '../../components/yourlocal/JoinForm';
import YLShell from '../../components/yourlocal/YLShell';
import { getSignedInMember, isSignupOpen } from '../../lib/community';

export const metadata = {
  title: 'Join free | YourLocal',
  description: 'Free profiles for local businesses, bands, artists, podcasts and bloggers.',
};
export const dynamic = 'force-dynamic';

export default async function JoinPage({ searchParams = {} }) {
  if (!isSignupOpen()) notFound();
  const { member } = await getSignedInMember(cookies());
  if (member) redirect('/account');

  return (
    <YLShell>
      <header className="yl-hero yl-narrow">
        <span className="yl-eyebrow">YourLocal</span>
        <h1>Get found by people nearby</h1>
        <p className="yl-hero-sub">A free profile for local businesses, bands, artists, podcasts and bloggers. Share your work and connect with your community.</p>
      </header>
      <JoinForm mode="join" initialType={String(searchParams.type || '')} />
    </YLShell>
  );
}
