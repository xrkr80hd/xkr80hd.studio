import '../account.css';
import LoginForm from '../../components/LoginForm';
import { requireOwner } from '../../lib/xstudio-server';
import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Sign in | XSTUDIO',
  robots: { index: false, follow: false },
};

export default async function LoginPage({ searchParams }) {
  const params = (await searchParams) || {};
  const { recovery, next, manual } = params;

  if (manual !== 'true') {
    const context = await requireOwner();
    if (context.user?.id) {
      redirect('/');
    }
  }

  return <LoginForm recovery={recovery} next={next} />;
}
