import PageSwitchGate from '../../components/PageSwitchGate';

export const dynamic = 'force-dynamic';

export default function PageLayout({ children }) {
  return <PageSwitchGate pageKey="lets-gleaux">{children}</PageSwitchGate>;
}
