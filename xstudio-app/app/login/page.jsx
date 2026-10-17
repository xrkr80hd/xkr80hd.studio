import LoginForm from '../../components/LoginForm';

export const metadata = {
  title: 'Sign in | XSTUDIO',
  robots: { index: false, follow: false },
};

export default async function LoginPage({ searchParams }) {
  const { recovery } = await searchParams;
  return <LoginForm recovery={recovery} />;
}
