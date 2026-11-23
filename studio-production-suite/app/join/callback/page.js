import YLShell from '../../../components/yourlocal/YLShell';
import JoinCallback from '../../../components/yourlocal/JoinCallback';

export const metadata = { title: 'Signing in | YourLocal' };

export default function JoinCallbackPage() {
  return (
    <YLShell>
      <JoinCallback />
    </YLShell>
  );
}
