import { SidebarTrigger } from '@/components/ui/sidebar';
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

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
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
    </>
  );
}
