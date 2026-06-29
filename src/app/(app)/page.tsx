'use client';

import { useState } from 'react';
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
import { useAccountCount } from '@/hooks/use-accounts';
import { useAppointmentCount } from '@/hooks/use-appointments';
import { useStats, type StatsPeriod } from '@/hooks/use-stats';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function Home() {
  const [period, setPeriod] = useState<StatsPeriod>('all');
  const { data: accountCount, isLoading } = useAccountCount();
  const { data: appointmentCount, isLoading: isLoadingAppointmentCount } =
    useAppointmentCount();
  const { data: stats, isLoading: isLoadingStats } = useStats({ period });

  return (
    <div className='flex flex-col gap-10'>
      <SearchAccounts />

      <div className='flex items-center justify-between'>
        <h2 className='text-xl font-semibold'>Overview</h2>
        <Select value={period} onValueChange={(value: StatsPeriod) => setPeriod(value)}>
          <SelectTrigger className='w-[180px]'>
            <SelectValue placeholder='Select period' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='day'>Today</SelectItem>
            <SelectItem value='month'>This Month</SelectItem>
            <SelectItem value='year'>This Year</SelectItem>
            <SelectItem value='all'>All Time</SelectItem>
          </SelectContent>
        </Select>
      </div>

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

        <Link
          href='/services'
          className='group w-full border p-4 rounded-md flex flex-col gap-2 bg-white hover:shadow-xs transition-shadow'
        >
          <div className='flex items-center justify-between'>
            <p className='text-[15px] text-neutral-600 group-hover:underline'>Most popular service</p>
          </div>
          <p className='font-bold text-xl text-purple'>
            {isLoadingStats ? (
              <Loader2 className='animate-spin text-purple' />
            ) : stats?.mostPopularService ? (
              stats.mostPopularService
            ) : (
              'N/A'
            )}
          </p>
        </Link>
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
