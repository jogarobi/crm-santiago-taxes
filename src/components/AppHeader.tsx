'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { PageHeader } from '@/components/PageHeader';
import {
  ArrowUpRightIcon,
  CalendarIcon,
  CheckCheckIcon,
  PlusIcon,
  StickyNoteIcon,
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
import { AppointmentDialog } from './AppointmentDialog';
import { CreateNoteDialog } from './CreateNoteDialog';
import { CreateClientDialog } from './CreateClientDialog';
import { CreateTaskDialog } from './CreateTaskDialog';

export function AppHeader() {
  const router = useRouter();
  const [appointmentDialogOpen, setAppointmentDialogOpen] = useState(false);
  const [createNoteDialogOpen, setCreateNoteDialogOpen] = useState(false);
  const [createClientDialogOpen, setCreateClientDialogOpen] = useState(false);
  const [createTaskDialogOpen, setCreateTaskDialogOpen] = useState(false);

  const handleClientCreated = (accountId: number) => {
    router.push(`/clients/${accountId}`);
  };

  return (
    <>
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
                <span>New</span>
                <PlusIcon />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end'>
              <DropdownMenuItem
                className='px-4 py-3 cursor-pointer'
                onClick={() => setCreateNoteDialogOpen(true)}
              >
                <StickyNoteIcon className='stroke-neutral-500' />
                <span className=' font-normal'>Create note</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                className='px-4 py-3 cursor-pointer'
                onClick={() => setAppointmentDialogOpen(true)}
              >
                <CalendarIcon className='stroke-neutral-500' />
                <span className=' font-normal'>Schedule appointment</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                className='px-4 py-3 cursor-pointer'
                onClick={() => setCreateClientDialogOpen(true)}
              >
                <UserPlusIcon className='stroke-neutral-500' />
                <span className=' font-normal'>Create client</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                className='px-4 py-3 cursor-pointer'
                onClick={() => setCreateTaskDialogOpen(true)}
              >
                <CheckCheckIcon className='stroke-neutral-500' />
                <span className=' font-normal'>Create task</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <AppointmentDialog
        open={appointmentDialogOpen}
        onOpenChange={setAppointmentDialogOpen}
      />
      <CreateNoteDialog
        open={createNoteDialogOpen}
        onOpenChange={setCreateNoteDialogOpen}
      />
      <CreateClientDialog
        open={createClientDialogOpen}
        onOpenChange={setCreateClientDialogOpen}
        onSuccess={handleClientCreated}
      />
      <CreateTaskDialog
        open={createTaskDialogOpen}
        onOpenChange={setCreateTaskDialogOpen}
      />
    </>
  );
}
