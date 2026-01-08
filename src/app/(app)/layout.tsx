import Sidebar from '@/components/Sidebar';
import { AppHeader } from '@/components/AppHeader';
import { requireAuth } from '@/lib/auth-utils';

export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await requireAuth();
  return (
    <>
      <Sidebar />

      <main className='w-full'>
        <AppHeader />
        <section className='px-10 pt-2 pb-10'>{children}</section>
      </main>
    </>
  );
}
