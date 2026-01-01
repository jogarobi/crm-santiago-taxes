import type { Metadata } from 'next';
import { Onest } from 'next/font/google';
import './globals.css';
import clsx from 'clsx';
import AllProviders from '@/providers/all-providers';

const onest = Onest({
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Santiago Taxes CRM',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='en'>
      <body className={clsx(onest.className, 'antialiased bg-neutral-50')}>
        <AllProviders>{children}</AllProviders>
      </body>
    </html>
  );
}
