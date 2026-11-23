import YLShell from '../../../components/yourlocal/YLShell';
import JoinCallback from '../../../components/yourlocal/JoinCallback';
import { joinPath, signInPath } from '../../../lib/community';

export const metadata = { title: 'Signing in | YourLocal', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

export default function JoinCallbackPage() {
  return (
    <YLShell>
      <JoinCallback joinHref={joinPath()} signInHref={signInPath()} />
    </YLShell>
  );
}
