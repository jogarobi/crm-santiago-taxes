import type { Metadata } from 'next';
import { Onest } from 'next/font/google';
import './globals.css';
import { SidebarTrigger } from '@/components/ui/sidebar';
import clsx from 'clsx';
import Sidebar from '@/components/Sidebar';
import { SearchAccounts } from '@/components/SearchAccounts';
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
            <header className='p-8 flex flex-col gap-7'>
              <div className='flex flex-col gap-4'>
                <div className='flex items-center gap-3 pb-2'>
                  <SidebarTrigger />
                  <PageHeader />
                </div>

                <div className='flex items-center justify-between'>
                  <h1 className='text-2xl font-semibold'>Home</h1>
                  <div className='flex items-center gap-3'>
                    <Button>
                      <Link href='https://online.taxslayerpro.com/'>
                        Go to TaxSlayerPro
                      </Link>
                      <ArrowUpRightIcon />
                    </Button>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button className='bg-purple'>
                          <span>New activity</span>
                          <PlusIcon />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align='end'>
                        <DropdownMenuItem className='px-4 py-3'>
                          <CalendarIcon className='stroke-neutral-500' />
                          <span className=' font-normal'>
                            Schedule appointment
                          </span>
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
                </div>
              </div>

              <SearchAccounts />
            </header>

            <section className='px-8 pt-2'>{children}</section>
          </main>
        </AllProviders>
      </body>
    </html>
  );
}
