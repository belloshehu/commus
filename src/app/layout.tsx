import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Antijj - Privacy-First Safety Platform',
  description: 'Privacy-preserving, community safety incident reporting platform.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Default locale is 'en' (LTR), client can switch to 'ar' (RTL)
  return (
    <html lang="en" dir="ltr">
      <body>{children}</body>
    </html>
  );
}
