import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';

export const metadata: Metadata = {
  title: 'Antijj - Privacy-First Safety Platform',
  description: 'Privacy-preserving, community safety incident reporting platform.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" dir="ltr">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
