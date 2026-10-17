import './globals.css';

export const metadata = {
  title: 'XSTUDIO | Private production library',
  description: 'Private production assets and project references.',
  robots: { index: false, follow: false },
  icons: { icon: '/xstudio.jpg' },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
