import { requireGuest } from '@/lib/auth-utils';

export default async function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await requireGuest();

  return <>{children}</>;
}
