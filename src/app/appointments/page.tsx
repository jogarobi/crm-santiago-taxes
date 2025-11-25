'use client';

import { useMemo, useState, useCallback } from 'react';
import Calendar from '@/components/Calendar';
import { CalendarEvent, CalendarView } from '@/components/Calendar/types';
import { useAppointments } from '@/lib/hooks/use-appointments';
import { transformAppointmentsToCalendarEvents } from '@/lib/utils/appointmentUtils';
import { Loader2 } from 'lucide-react';

export default function Appointments() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentView, setCurrentView] = useState<CalendarView>('month');

  const dateRange = useMemo(() => {
    const start = new Date(currentDate);
    const end = new Date(currentDate);

    switch (currentView) {
      case 'day':
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        break;
      case 'week':
        const dayOfWeek = start.getDay();
        start.setDate(start.getDate() - dayOfWeek);
        start.setHours(0, 0, 0, 0);
        end.setDate(start.getDate() + 6);
        end.setHours(23, 59, 59, 999);
        break;
      case 'month':
        start.setDate(1);
        start.setHours(0, 0, 0, 0);
        end.setMonth(end.getMonth() + 1, 0);
        end.setHours(23, 59, 59, 999);
        break;
    }

    return {
      startAtMin: start.toISOString(),
      startAtMax: end.toISOString(),
    };
  }, [currentDate, currentView]);

  const {
    data: appointments,
    isLoading,
    error,
    refetch,
  } = useAppointments({
    limit: 100,
    startAtMin: dateRange.startAtMin,
    startAtMax: dateRange.startAtMax,
  });

  const events = useMemo(() => {
    return transformAppointmentsToCalendarEvents(appointments || []);
  }, [appointments]);

  const handleEventClick = (event: CalendarEvent) => {
    const appointmentDetails = [
      `Appointment: ${event.title}`,
      `Time: ${event.startDate.toLocaleString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      })} - ${event.endDate.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      })}`,
      event.location ? `Location: ${event.location}` : '',
      event.description ? `Details: ${event.description}` : '',
    ]
      .filter(Boolean)
      .join('\n');

    alert(appointmentDetails);
  };

  const handleDateClick = (date: Date) => {
    console.log('Date clicked:', date);
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleEventCreate = (_eventData: Partial<CalendarEvent>) => {
    console.log('Create event functionality not implemented for appointments');
  };

  const handleRefresh = () => {
    refetch();
  };

  const handleDateChange = useCallback((date: Date) => {
    setCurrentDate(date);
  }, []);

  const handleViewChange = useCallback((view: CalendarView) => {
    setCurrentView(view);
  }, []);

  if (isLoading) {
    return (
      <div className='p-6 h-screen'>
        <div className='flex items-center justify-center h-[calc(100vh-120px)]'>
          <div className='flex items-center justify-center py-8'>
            <Loader2 className='w-6 h-6 animate-spin text-purple' />
            <span className='ml-2 text-neutral-600 text-sm'>
              Loading appointments...
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='p-6 h-screen'>
        <div className='flex flex-col items-center justify-center h-[calc(100vh-120px)]'>
          <div className='text-lg text-red-600 mb-4'>
            Error: {error.message}
          </div>
          <button
            onClick={handleRefresh}
            className='px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600'
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className='h-screen'>
      <div className='h-[calc(100vh-120px)] pt-2'>
        <Calendar
          events={events}
          view={currentView}
          currentDate={currentDate}
          onEventClick={handleEventClick}
          onDateClick={handleDateClick}
          onEventCreate={handleEventCreate}
          onDateChange={handleDateChange}
          onViewChange={handleViewChange}
        />
      </div>
    </div>
  );
}
