'use client';

import { useMemo } from 'react';
import { useAppointments } from '@/lib/hooks/use-appointments';
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import {
  ArrowUpRightIcon,
  CalendarIcon,
  ClockIcon,
  Loader2,
  UserIcon,
} from 'lucide-react';
import Link from 'next/link';
import { Badge } from './ui/badge';

export function UpcomingAppointments() {
  const dateRange = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of today

    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);
    nextWeek.setHours(23, 59, 59, 999); // End of day in 7 days

    return {
      startAtMin: today.toISOString(),
      startAtMax: nextWeek.toISOString(),
    };
  }, []); // Empty dependency array means this only runs once

  const {
    data: appointments,
    isLoading,
    error,
  } = useAppointments({
    limit: 10,
    ...dateRange,
  });

  // Format date and time
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    const dateFormatted = date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
    const timeFormatted = date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
    return { date: dateFormatted, time: timeFormatted };
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'ACCEPTED':
        return 'bg-green-100 text-green-700';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-700';
      case 'CANCELLED':
        return 'bg-red-100 text-red-700';
      case 'DECLINED':
        return 'bg-red-100 text-red-700';
      case 'NO_SHOW':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-blue-100 text-blue-700';
    }
  };

  if (isLoading) {
    return (
      <div className='flex items-center justify-center py-8'>
        <Loader2 className='w-6 h-6 animate-spin text-purple' />
        <span className='ml-2 text-neutral-600'>Loading appointments...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className='bg-red-50 border border-red-200 rounded-lg p-4 mt-4'>
        <p className='text-red-800 text-sm'>
          Failed to load appointments. Please try again later.
        </p>
      </div>
    );
  }

  if (!appointments || appointments.length === 0) {
    return (
      <div className='mt-4'>
        <Empty>
          <EmptyHeader>
            <EmptyMedia
              variant='default'
              className='py-2 px-3 bg-white border rounded-md'
            >
              <CalendarIcon className='w-5 stroke-neutral-500' />
            </EmptyMedia>
            <EmptyTitle className='text-[16px] font-normal'>
              No upcoming appointments
            </EmptyTitle>
            <Link
              className='text-purple text-[15px] hover:underline mt-1'
              href='/appointments'
            >
              Schedule an appointment
              <ArrowUpRightIcon className='w-4 inline-block ml-1' />
            </Link>
          </EmptyHeader>
        </Empty>
      </div>
    );
  }

  return (
    <div className='mt-4 space-y-3'>
      {appointments.map((appointment) => {
        const { date, time } = formatDateTime(appointment.startAt || '');

        return (
          <Link
            key={appointment.id}
            href={`/dashboard/appointments/${appointment.id}`}
            className='block bg-white border rounded-lg p-4 hover:shadow-md transition-shadow'
          >
            <div className='flex items-start justify-between'>
              <div className='flex-1'>
                <div className='flex items-center gap-3 mb-2'>
                  <div className='flex items-center gap-2'>
                    <CalendarIcon className='w-4 h-4 text-neutral-500' />
                    <span className='text-sm font-medium text-neutral-700'>
                      {date}
                    </span>
                  </div>
                  <div className='flex items-center gap-2'>
                    <ClockIcon className='w-4 h-4 text-neutral-500' />
                    <span className='text-sm text-neutral-600'>{time}</span>
                  </div>
                </div>

                {appointment.customerId && (
                  <div className='flex items-center gap-2 mb-2'>
                    <UserIcon className='w-4 h-4 text-neutral-500' />
                    <span className='text-sm text-neutral-700'>
                      Customer ID: {appointment.customerId}
                    </span>
                  </div>
                )}

                {appointment.customerNote && (
                  <p className='text-sm text-neutral-600 mt-1'>
                    {appointment.customerNote}
                  </p>
                )}
              </div>

              {appointment.status && (
                <Badge
                  variant='secondary'
                  className={getStatusColor(appointment.status)}
                >
                  {appointment.status}
                </Badge>
              )}
            </div>
          </Link>
        );
      })}

      {appointments.length > 0 && (
        <Link
          href='/dashboard/appointments'
          className='block text-center text-purple text-sm font-medium hover:underline pt-2'
        >
          View all appointments
          <ArrowUpRightIcon className='w-4 inline-block ml-1' />
        </Link>
      )}
    </div>
  );
}
