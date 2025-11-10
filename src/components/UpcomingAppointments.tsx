'use client';

import { useMemo } from 'react';
import { useAppointments } from '@/lib/hooks/use-appointments';
import { CustomerName } from '@/components/CustomerName';
import { ServiceName } from '@/components/ServiceName';
import { capitalizeFirst, getRelativeDate } from '@/lib/utils/string';
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
} from 'lucide-react';
import Link from 'next/link';
import { Badge } from './ui/badge';
import clsx from 'clsx';

export function UpcomingAppointments() {
  const dateRange = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);
    nextWeek.setHours(23, 59, 59, 999);

    return {
      startAtMin: today.toISOString(),
      startAtMax: nextWeek.toISOString(),
    };
  }, []);

  const {
    data: appointments,
    isLoading,
    error,
  } = useAppointments({
    limit: 10,
    ...dateRange,
  });

  const upcomingAppointments = useMemo(() => {
    if (!appointments) return [];
    return appointments
      .filter((appointment) => !appointment.status?.includes('CANCELLED'))
      .slice(0, 3);
  }, [appointments]);

  const formatDateTime = (
    dateString: string,
    durationMinutes?: number
  ): { date: string; time: string } => {
    const startDate = new Date(dateString);

    const relativeDate = getRelativeDate(dateString);

    const formattedDate = startDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });

    let dateFormatted: string;
    if (relativeDate === 'Today') {
      dateFormatted = 'Today';
    } else {
      dateFormatted = `${relativeDate}, ${formattedDate}`;
    }

    const startTimeFormatted = startDate.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

    if (durationMinutes) {
      const endDate = new Date(startDate.getTime() + durationMinutes * 60000);
      const endTimeFormatted = endDate.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
      return {
        date: dateFormatted,
        time: `${startTimeFormatted} - ${endTimeFormatted}`,
      };
    }

    return { date: dateFormatted, time: startTimeFormatted };
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
        <span className='ml-2 text-neutral-600 text-sm'>
          Loading appointments...
        </span>
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

  if (!upcomingAppointments || upcomingAppointments.length === 0) {
    return (
      <div className='mt-4'>
        <Empty>
          <EmptyHeader>
            <EmptyMedia
              variant='default'
              className='py-2 px-3 border rounded-md'
            >
              <CalendarIcon className='w-5 stroke-neutral-500' />
            </EmptyMedia>
            <EmptyTitle className='text-[16px] text-neutral-500 font-normal'>
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
    <div className='mt-4 flex flex-col gap-5'>
      {upcomingAppointments.map((appointment) => {
        const durationMinutes =
          appointment.appointmentSegments?.[0]?.durationMinutes || undefined;
        const { date, time } = formatDateTime(
          appointment.startAt || '',
          durationMinutes
        );

        return (
          <Link
            key={appointment.id}
            href='#'
            /* href={`/appointments/${appointment.id}`} */
            className='block bg-white border rounded-lg p-4 hover:shadow-xs transition-shadow'
          >
            <div className='flex items-start justify-between'>
              <div className='flex-1'>
                <div className='flex items-center gap-3 justify-between mb-2'>
                  {appointment.appointmentSegments?.[0]?.serviceVariationId && (
                    <div>
                      <ServiceName
                        serviceVariationId={
                          appointment.appointmentSegments[0].serviceVariationId
                        }
                        className='font-semibold'
                      />
                    </div>
                  )}

                  {appointment.status && (
                    <Badge
                      variant='secondary'
                      className={clsx(
                        getStatusColor(appointment.status),
                        'text-[13px] font-medium'
                      )}
                    >
                      {capitalizeFirst(appointment.status)}
                    </Badge>
                  )}
                </div>

                <div className='mb-3 flex items-center gap-2 flex-wrap'>
                  <CustomerName customerId={appointment.customerId} />
                  {/*                   {appointment.appointmentSegments?.[0]?.teamMemberId && (
                    <>
                      <span className='text-[15px] text-neutral-500'>with</span>
                      <TeamMemberName
                        teamMemberId={
                          appointment.appointmentSegments[0].teamMemberId
                        }
                        className='text-[15px] text-neutral-700'
                      />
                    </>
                  )} */}
                </div>

                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-2'>
                    <CalendarIcon className='w-4 h-4 text-neutral-500' />
                    <span className='text-sm font-medium text-neutral-500'>
                      {date}
                    </span>
                  </div>
                  <div className='flex items-center gap-2'>
                    <ClockIcon className='w-4 h-4 text-neutral-500' />
                    <span className='text-sm text-neutral-600'>{time}</span>
                  </div>
                </div>

                {appointment.customerNote && (
                  <p className='text-sm text-neutral-600 mt-1'>
                    {appointment.customerNote}
                  </p>
                )}
              </div>
            </div>
          </Link>
        );
      })}

      {upcomingAppointments.length > 0 && (
        <Link
          href='/appointments'
          className='block text-center text-purple text-[15px] font-normal hover:underline pt-2'
        >
          View all appointments
          <ArrowUpRightIcon className='w-4 inline-block ml-1' />
        </Link>
      )}
    </div>
  );
}
