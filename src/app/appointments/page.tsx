'use client';

import { useState, useMemo, useEffect } from 'react';
import { useAppointments } from '@/lib/hooks/use-appointments';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  CalendarIcon,
  ClockIcon,
  Loader2,
  UserIcon,
  PlusIcon,
} from 'lucide-react';
import Link from 'next/link';

export default function AppointmentsPage() {
  const [timeFilter, setTimeFilter] = useState<'upcoming' | 'past' | 'all'>(
    'upcoming'
  );

  // Set document title
  useEffect(() => {
    document.title = 'Appointments | Santiago Taxes CRM';
  }, []);

  const filterDates = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    switch (timeFilter) {
      case 'upcoming':
        return {
          startAtMin: today.toISOString(),
          startAtMax: undefined,
        };
      case 'past':
        return {
          startAtMin: undefined,
          startAtMax: today.toISOString(),
        };
      default:
        return {
          startAtMin: undefined,
          startAtMax: undefined,
        };
    }
  }, [timeFilter]);

  const {
    data: appointments,
    isLoading,
    error,
  } = useAppointments({
    limit: 50,
    ...filterDates,
  });

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    const dateFormatted = date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
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

  return (
    <div className='flex flex-col gap-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-semibold'>Appointments</h1>
          <p className='text-neutral-600 text-sm mt-1'>
            Manage your appointments and bookings
          </p>
        </div>
        <Button className='bg-purple'>
          <PlusIcon className='w-4 h-4' />
          <span>New Appointment</span>
        </Button>
      </div>

      {/* Filters */}
      <div className='flex gap-2'>
        <Button
          variant={timeFilter === 'upcoming' ? 'default' : 'outline'}
          onClick={() => setTimeFilter('upcoming')}
          className={timeFilter === 'upcoming' ? 'bg-purple' : ''}
        >
          Upcoming
        </Button>
        <Button
          variant={timeFilter === 'past' ? 'default' : 'outline'}
          onClick={() => setTimeFilter('past')}
          className={timeFilter === 'past' ? 'bg-purple' : ''}
        >
          Past
        </Button>
        <Button
          variant={timeFilter === 'all' ? 'default' : 'outline'}
          onClick={() => setTimeFilter('all')}
          className={timeFilter === 'all' ? 'bg-purple' : ''}
        >
          All
        </Button>
      </div>

      {/* Content */}
      {isLoading && (
        <div className='flex items-center justify-center py-12'>
          <Loader2 className='w-8 h-8 animate-spin text-purple' />
          <span className='ml-3 text-neutral-600'>Loading appointments...</span>
        </div>
      )}

      {error && (
        <div className='bg-red-50 border border-red-200 rounded-lg p-4'>
          <p className='text-red-800'>
            Failed to load appointments. Please try again later.
          </p>
        </div>
      )}

      {!isLoading && !error && (!appointments || appointments.length === 0) && (
        <div className='bg-white border rounded-lg p-12 text-center'>
          <CalendarIcon className='w-12 h-12 text-neutral-400 mx-auto mb-4' />
          <h3 className='text-lg font-medium text-neutral-900 mb-2'>
            No appointments found
          </h3>
          <p className='text-neutral-600 mb-4'>
            {timeFilter === 'upcoming'
              ? 'You have no upcoming appointments scheduled.'
              : timeFilter === 'past'
              ? 'You have no past appointments.'
              : 'No appointments available.'}
          </p>
          <Button className='bg-purple'>
            <PlusIcon className='w-4 h-4' />
            <span>Schedule Appointment</span>
          </Button>
        </div>
      )}

      {!isLoading && !error && appointments && appointments.length > 0 && (
        <div className='space-y-3'>
          <p className='text-sm text-neutral-600'>
            Showing {appointments.length} appointment
            {appointments.length !== 1 ? 's' : ''}
          </p>

          {appointments.map((appointment) => {
            const { date, time } = formatDateTime(appointment.startAt || '');

            return (
              <Link
                key={appointment.id}
                href={`/appointments/${appointment.id}`}
                className='block bg-white border rounded-lg p-5 hover:shadow-md transition-shadow'
              >
                <div className='flex items-start justify-between'>
                  <div className='flex-1'>
                    <div className='flex items-center gap-4 mb-3'>
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

                    <div className='space-y-2'>
                      {appointment.customerId && (
                        <div className='flex items-center gap-2'>
                          <UserIcon className='w-4 h-4 text-neutral-500' />
                          <span className='text-sm text-neutral-700'>
                            Customer: {appointment.customerId}
                          </span>
                        </div>
                      )}

                      {appointment.locationId && (
                        <div className='flex items-center gap-2'>
                          <span className='text-xs text-neutral-500'>
                            Location ID: {appointment.locationId}
                          </span>
                        </div>
                      )}

                      {appointment.customerNote && (
                        <p className='text-sm text-neutral-600 mt-2 pl-6'>
                          {appointment.customerNote}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className='flex flex-col items-end gap-2'>
                    {appointment.status && (
                      <Badge
                        variant='secondary'
                        className={getStatusColor(appointment.status)}
                      >
                        {appointment.status}
                      </Badge>
                    )}
                    {appointment.appointmentSegments &&
                      appointment.appointmentSegments.length > 0 && (
                        <span className='text-xs text-neutral-500'>
                          {appointment.appointmentSegments[0].durationMinutes}{' '}
                          min
                        </span>
                      )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
