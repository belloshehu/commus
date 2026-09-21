import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';

export const metadata: Metadata = {
  title: 'Commus - Privacy-First Safety Platform',
  description: 'Commus: Privacy-preserving community safety and early-warning crisis response platform.',
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
