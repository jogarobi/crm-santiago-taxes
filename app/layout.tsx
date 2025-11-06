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
  PlusIcon,
  Search,
  UserPlusIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

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
        <SidebarProvider>
          <Sidebar />

          <main className='w-full'>
            <header className='p-8 flex flex-col gap-7'>
              <div className='flex items-center gap-2'>
                <SidebarTrigger />

                <h1 className='text-2xl font-semibold'>Dashboard</h1>

                <DropdownMenu>
                  <DropdownMenuTrigger className='ml-auto' asChild>
                    <Button className='bg-purple'>
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

              <InputGroup className='py-6 bg-white'>
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
