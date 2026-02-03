import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Goldenia - Digital Gold & Silver Trading',
  description: 'Trade and store gold and silver securely',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
