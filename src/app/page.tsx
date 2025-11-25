'use client';

import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { ArrowUpRightIcon, CheckCheckIcon, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { UpcomingAppointments } from '@/components/UpcomingAppointments';
import { SearchAccounts } from '@/components/SearchAccounts';
import { useAccountCount } from '@/lib/hooks/use-accounts';

export default function Home() {
  const { data: accountCount, isLoading } = useAccountCount();

  return (
    <div className='flex flex-col gap-10'>
      <SearchAccounts />
      <div className='flex items-center gap-7'>
        <div className='w-full border p-4 rounded-md flex flex-col gap-2 bg-white'>
          <div className='flex items-center justify-between'>
            <p className='text-[15px] text-neutral-600'>Total clients</p>
          </div>
          <p className='font-bold text-[22px] text-purple'>
            {isLoading ? (
              <Loader2 className='animate-spin text-purple' />
            ) : (
              accountCount?.count?.toLocaleString() || '0'
            )}
          </p>
        </div>
        <div className='w-full border p-4 rounded-md flex flex-col gap-2 bg-white'>
          <div className='flex items-center justify-between'>
            <p className='text-[15px] text-neutral-600'>Revenue</p>
          </div>
          <p className='font-bold text-[22px] text-purple'>$14,450.25</p>
        </div>
        <div className='w-full border p-4 rounded-md flex flex-col gap-2 bg-white'>
          <div className='flex items-center justify-between'>
            <p className='text-[15px] text-neutral-600'>Appointments</p>
          </div>
          <p className='font-bold text-[22px] text-purple'>27</p>
        </div>

        <div className='w-full border p-4 rounded-md flex flex-col gap-2 bg-white'>
          <div className='flex items-center justify-between'>
            <p className='text-[15px] text-neutral-600'>Most popular service</p>
          </div>
          <p className='font-bold text-xl text-purple'>Tax Preparation</p>
        </div>
      </div>

      <div className='flex gap-14'>
        <div className='w-full'>
          <div className='flex items-center justify-between mb-5'>
            <h3 className='font-semibold text-[17px]'>Upcoming appointments</h3>
            <span className='text-neutral-600 text-[15px]'>Next 2 weeks</span>
          </div>

          <UpcomingAppointments />
        </div>

        <div className='w-full'>
          <div className='flex items-center justify-between'>
            <h3 className='font-semibold text-[17px]'>Pending tasks</h3>
            <span className='text-neutral-500 text-[15px]'></span>
          </div>

          <div>
            <Empty>
              <EmptyHeader>
                <EmptyMedia
                  variant='default'
                  className='py-2 px-3 border rounded-md'
                >
                  <CheckCheckIcon className='w-5 stroke-neutral-500' />
                </EmptyMedia>
                <EmptyTitle className='text-[16px] text-neutral-500 font-normal'>
                  No pending tasks
                </EmptyTitle>
                <Link
                  className='text-purple text-[15px] hover:underline mt-1'
                  href='/appointments'
                >
                  Create task
                  <ArrowUpRightIcon className='w-4 inline-block ml-1' />
                </Link>
              </EmptyHeader>
            </Empty>
          </div>
        </div>
      </div>
    </div>
  );
}
