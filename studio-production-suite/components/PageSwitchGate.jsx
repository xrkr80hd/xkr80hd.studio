import Link from 'next/link';
import { checkPageEnabled } from '../lib/page-visibility';

export default async function PageSwitchGate({ pageKey, children }) {
  const { adminPreview } = await checkPageEnabled(pageKey);
  return (
    <>
      {adminPreview ? (
        <p className="page-off-banner">
          This page is <strong>OFF</strong>. Only you can see it because you are signed in.{' '}
          <Link href="/admin?open=pages#page-switches" prefetch={false}>Turn it on</Link>
        </p>
      ) : null}
      {children}
    </>
  );
}
