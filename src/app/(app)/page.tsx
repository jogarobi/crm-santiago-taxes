'use client';

import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import { UpcomingAppointments } from '@/components/UpcomingAppointments';
import { TodaysWork } from '@/components/TodaysWork';
import { SearchAccounts } from '@/components/SearchAccounts';
import { useAccountCount } from '@/hooks/use-accounts';
import { useAppointmentCount } from '@/hooks/use-appointments';
import { useStats } from '@/hooks/use-stats';

export default function Home() {
  const { data: accountCount, isLoading } = useAccountCount();
  const { data: appointmentCount, isLoading: isLoadingAppointmentCount } =
    useAppointmentCount();
  const { data: stats, isLoading: isLoadingStats } = useStats({ period: 'all' });

  return (
    <div className='flex flex-col gap-10'>
      <SearchAccounts />

      <div className='flex items-center gap-7'>
        <Link
          href='/clients'
          className='group w-full border p-4 rounded-md flex flex-col gap-2 bg-white hover:shadow-xs transition-shadow'
        >
          <div className='flex items-center justify-between'>
            <p className='text-[15px] text-neutral-600 group-hover:underline'>Total clients</p>
          </div>
          <p className='font-bold text-[22px] text-purple'>
            {isLoading ? (
              <Loader2 className='animate-spin text-purple' />
            ) : (
              accountCount?.count?.toLocaleString() || '0'
            )}
          </p>
        </Link>
        <Link
          href='/businesses'
          className='group w-full border p-4 rounded-md flex flex-col gap-2 bg-white hover:shadow-xs transition-shadow'
        >
          <div className='flex items-center justify-between'>
            <p className='text-[15px] text-neutral-600 group-hover:underline'>Businesses</p>
          </div>
          <p className='font-bold text-[22px] text-purple'>
            {isLoadingStats ? (
              <Loader2 className='animate-spin text-purple' />
            ) : (
              stats?.totalBusinesses?.toLocaleString() || '0'
            )}
          </p>
        </Link>
        <Link
          href='/appointments'
          className='group w-full border p-4 rounded-md flex flex-col gap-2 bg-white hover:shadow-xs transition-shadow'
        >
          <div className='flex items-center justify-between'>
            <p className='text-[15px] text-neutral-600 group-hover:underline'>Appointments</p>
          </div>
          <p className='font-bold text-[22px] text-purple'>
            {isLoadingAppointmentCount ? (
              <Loader2 className='animate-spin text-purple' />
            ) : (
              appointmentCount?.count?.toLocaleString() || '0'
            )}
          </p>
        </Link>
      </div>

      <div className='flex gap-14'>
        <TodaysWork />

        <div className='w-full min-w-0'>
          <UpcomingAppointments />
        </div>
      </div>
    </div>
  );
}
