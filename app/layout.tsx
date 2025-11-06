import type { Metadata } from 'next';
import { Onest } from 'next/font/google';
import './globals.css';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import clsx from 'clsx';
import Sidebar from '@/components/Sidebar';
import {
  InputGroup,
  InputGroupInput,
  InputGroupAddon,
} from '@/components/ui/input-group';
import {
  CalendarIcon,
  CheckCheckIcon,
  CircleDollarSignIcon,
  Search,
  UserPlusIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

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
      <body className={clsx(onest.className, 'antialiased')}>
        <SidebarProvider>
          <Sidebar />

          <main className='w-full'>
            <header className='p-8 flex flex-col gap-7'>
              <div className='flex items-center gap-2'>
                <SidebarTrigger />

                <h1 className='text-2xl font-semibold'>Dashboard</h1>

                <div className='ml-auto flex items-center gap-3'>
                  <Button variant='outline'>
                    <CalendarIcon className='stroke-neutral-500' />
                    <span className=' font-normal'>Schedule appointment</span>
                  </Button>

                  <Button variant='outline'>
                    <UserPlusIcon className='stroke-neutral-500' />
                    <span className=' font-normal'>Create client</span>
                  </Button>

                  <Button variant='outline'>
                    <CircleDollarSignIcon className='stroke-neutral-500' />
                    <span className=' font-normal'>Take payment</span>
                  </Button>

                  <Button variant='outline'>
                    <CheckCheckIcon className='stroke-neutral-500' />
                    <span className=' font-normal'>Create task</span>
                  </Button>
                </div>
              </div>

              <InputGroup className='py-5'>
                <InputGroupInput placeholder='Search client...' />
                <InputGroupAddon>
                  <Search />
                </InputGroupAddon>
              </InputGroup>
            </header>

            <section className='px-8 pt-2'>{children}</section>
          </main>
        </SidebarProvider>
      </body>
    </html>
  );
}
