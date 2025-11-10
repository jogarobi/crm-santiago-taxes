import type { Metadata } from 'next';
import { Onest } from 'next/font/google';
import './globals.css';
import { SidebarTrigger } from '@/components/ui/sidebar';
import clsx from 'clsx';
import Sidebar from '@/components/Sidebar';
import { PageHeader } from '@/components/PageHeader';
import {
  ArrowUpRightIcon,
  CalendarIcon,
  CheckCheckIcon,
  CircleDollarSignIcon,
  PlusIcon,
  UserPlusIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import Link from 'next/link';
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
        <AllProviders>
          <Sidebar />

          <main className='w-full'>
            <header className='px-10 pt-8 pb-4 flex items-center gap-3'>
              <SidebarTrigger />
              <PageHeader />
              <div className='flex items-center gap-3'>
                <Link href='https://online.taxslayerpro.com/'>
                  <Button className='cursor-pointer'>
                    <span>Go to TaxSlayerPro</span>
                    <ArrowUpRightIcon />
                  </Button>
                </Link>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant='outline'>
                      <span>New activity</span>
                      <PlusIcon />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align='end'>
                    <DropdownMenuItem className='px-4 py-3'>
                      <CalendarIcon className='stroke-neutral-500' />
                      <span className=' font-normal'>Schedule appointment</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem className='px-4 py-3'>
                      <UserPlusIcon className='stroke-neutral-500' />
                      <span className=' font-normal'>Create client</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem className='px-4 py-3'>
                      <CircleDollarSignIcon className='stroke-neutral-500' />
                      <span className=' font-normal'>Take payment</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem className='px-4 py-3'>
                      <CheckCheckIcon className='stroke-neutral-500' />
                      <span className=' font-normal'>Create task</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </header>

            <section className='px-10 pt-2 pb-10'>{children}</section>
          </main>
        </AllProviders>
      </body>
    </html>
  );
}
