import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import AccountManager from '../../components/yourlocal/AccountManager';
import YLShell from '../../components/yourlocal/YLShell';
import { getSignedInMember, listMemberMedia, signInPath } from '../../lib/community';
import { MEDIA_LIMITS, MEMBER_TYPES } from '../../lib/community-rules.mjs';

export const metadata = { title: 'Your account | YourLocal', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

export default async function AccountPage({ searchParams = {} }) {
  const { member, setupNeeded } = await getSignedInMember(cookies());

  if (setupNeeded) {
    return (
      <YLShell>
        <div className="yl-panel yl-narrow">
          <h2>Accounts are almost ready</h2>
          <p>Member accounts are not switched on yet. Please check back soon.</p>
        </div>
      </YLShell>
    );
  }
  if (!member) redirect(signInPath());

  const media = await listMemberMedia(member.id, { withUrls: true });

  return (
    <YLShell>
      <AccountManager
        initialMember={member}
        initialMedia={media}
        limits={MEDIA_LIMITS}
        types={MEMBER_TYPES}
        welcome={searchParams.welcome === '1'}
      />
    </YLShell>
  );
}
