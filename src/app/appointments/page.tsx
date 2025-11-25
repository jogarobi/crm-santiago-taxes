'use client';

import { useMemo, useState, useCallback } from 'react';
import Calendar from '@/components/Calendar';
import { CalendarEvent, CalendarView } from '@/components/Calendar/types';
import { useAppointments } from '@/lib/hooks/use-appointments';
import { transformAppointmentsToCalendarEvents } from '@/lib/utils/appointmentUtils';
import {
  Loader2,
  CalendarIcon,
  ClockIcon,
  UserIcon,
  AlertTriangleIcon,
  TriangleAlertIcon,
  ChevronDownIcon,
  ArrowLeft,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Appointment } from '@/lib/types/appointment';
import { capitalizeFirst, getRelativeDate } from '@/lib/utils/string';
import { useSyncAppointment } from '@/lib/hooks/use-appointments';
import { CreateClientDialog } from '@/components/CreateClientDialog';
import { LinkClientDialog } from '@/components/LinkClientDialog';
import Link from 'next/link';
import clsx from 'clsx';

export default function Appointments() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentView, setCurrentView] = useState<CalendarView>('month');
  const [selectedAppointment, setSelectedAppointment] =
    useState<Appointment | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isDateDialogOpen, setIsDateDialogOpen] = useState(false);
  const [viewingAppointmentFromDate, setViewingAppointmentFromDate] =
    useState(false);
  const [isCreateClientDialogOpen, setIsCreateClientDialogOpen] =
    useState(false);
  const [isLinkClientDialogOpen, setIsLinkClientDialogOpen] = useState(false);
  const syncAppointment = useSyncAppointment();

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

  const formatDateTime = (
    startAt: string,
    endAt?: string
  ): { date: string; time: string } => {
    const startDate = new Date(startAt);

    const relativeDate = getRelativeDate(startAt);

    const formattedDate = startDate.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
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

    if (endAt) {
      const endDate = new Date(endAt);
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

  const handleEventClick = (event: CalendarEvent) => {
    // Find the appointment that matches the event
    const appointment = appointments?.find((apt) => apt.id === event.id);
    if (appointment) {
      setSelectedAppointment(appointment);
      setIsDialogOpen(true);
    }
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    setIsDateDialogOpen(true);
  };

  const getAppointmentsForDate = (date: Date) => {
    if (!appointments) return [];
    return appointments.filter((appointment) => {
      const appointmentDate = new Date(appointment.startAt || '');
      return appointmentDate.toDateString() === date.toDateString();
    });
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

  const handleCreateClient = () => {
    setIsCreateClientDialogOpen(true);
  };

  const handleLinkClient = () => {
    setIsLinkClientDialogOpen(true);
  };

  const handleClientCreated = async (accountId: number) => {
    if (!selectedAppointment?.id) return;

    try {
      await syncAppointment.mutateAsync({
        id: selectedAppointment.id,
        accountId,
      });

      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error syncing appointment:', error);
    }
  };

  const handleClientLinked = async (accountId: number) => {
    if (!selectedAppointment?.id) return;

    try {
      await syncAppointment.mutateAsync({
        id: selectedAppointment.id,
        accountId,
        customerId: selectedAppointment.customerId,
      });

      setIsLinkClientDialogOpen(false);
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error linking appointment:', error);
    }
  };

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
    <>
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

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className='max-w-2xl'>
          <DialogHeader>
            <DialogTitle className='text-xl'>
              {selectedAppointment?.service || 'Appointment Details'}
            </DialogTitle>
          </DialogHeader>

          {selectedAppointment && (
            <div className='flex flex-col gap-4 mt-2'>
              {selectedAppointment.status && (
                <Badge
                  variant='secondary'
                  className={clsx(
                    getStatusColor(selectedAppointment.status),
                    'text-[13px] font-medium w-fit'
                  )}
                >
                  {capitalizeFirst(selectedAppointment.status)}
                </Badge>
              )}

              {!selectedAppointment.accountId && (
                <div className='flex gap-3 border p-4 rounded-lg my-2'>
                  <TriangleAlertIcon
                    className='w-6 text-destructive'
                    strokeWidth={2.4}
                  />

                  <div>
                    <h4 className='text-[15px] font-semibold text-destructive mb-1'>
                      Client Not Synced
                    </h4>
                    <p className='text-sm text-destructive mb-4'>
                      This appointment has a customer which is not linked to a
                      CRM client.
                    </p>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button className='cursor-pointer'>
                          <span>Sync client</span>
                          <ChevronDownIcon />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align='start'>
                        <DropdownMenuItem onClick={handleCreateClient}>
                          Create new
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleLinkClient}>
                          Link to existing one
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              )}

              <div className='flex items-center gap-3'>
                <CalendarIcon className='w-5 h-5 text-neutral-500' />
                <div className='flex flex-col'>
                  <span className='text-sm font-medium text-neutral-600'>
                    Date
                  </span>
                  <span className='text-[15px] text-neutral-900'>
                    {
                      formatDateTime(
                        selectedAppointment.startAt || '',
                        selectedAppointment.endAt
                      ).date
                    }
                  </span>
                </div>
              </div>

              <div className='flex items-center gap-3'>
                <ClockIcon className='w-5 h-5 text-neutral-500' />
                <div className='flex flex-col'>
                  <span className='text-sm font-medium text-neutral-600'>
                    Time
                  </span>
                  <span className='text-[15px] text-neutral-900'>
                    {
                      formatDateTime(
                        selectedAppointment.startAt || '',
                        selectedAppointment.endAt
                      ).time
                    }{' '}
                    {selectedAppointment.durationMinutes && (
                      <>({selectedAppointment.durationMinutes} minutes)</>
                    )}
                  </span>
                </div>
              </div>

              {selectedAppointment.accountName && (
                <div className='flex items-center gap-3 w-full'>
                  <UserIcon className='w-5 h-5 text-neutral-500' />
                  <div className='flex flex-col w-full'>
                    <span className='text-sm font-medium text-neutral-600'>
                      Client
                    </span>
                    <Link
                      href={
                        selectedAppointment.accountId
                          ? `/clients/${selectedAppointment.accountId}`
                          : '#'
                      }
                      className={clsx('text-[15px] hover:underline', {
                        'text-purple cursor-pointer':
                          selectedAppointment.accountId,
                        'cursor-not-allowed': !selectedAppointment.accountId,
                      })}
                    >
                      {selectedAppointment.accountName}
                    </Link>
                  </div>
                </div>
              )}

              <div className='border-t pt-6 mt-3 text-sm text-neutral-500 flex flex-col gap-2'>
                {selectedAppointment.createdBy && (
                  <p>Booked by: {selectedAppointment.createdBy}</p>
                )}
                {selectedAppointment.createdAt && (
                  <p>
                    Created on:{' '}
                    {new Date(selectedAppointment.createdAt).toLocaleString()}
                  </p>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={isDateDialogOpen}
        onOpenChange={(open) => {
          setIsDateDialogOpen(open);
          if (!open) {
            setViewingAppointmentFromDate(false);
            setSelectedAppointment(null);
          }
        }}
      >
        <DialogContent className='max-w-2xl'>
          {!viewingAppointmentFromDate ? (
            <>
              <DialogHeader>
                <DialogTitle className='text-[19px]'>
                  Appointments for{' '}
                  {selectedDate?.toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </DialogTitle>
              </DialogHeader>

              {selectedDate && (
                <div className='flex flex-col gap-3 mt-2'>
                  {getAppointmentsForDate(selectedDate).length === 0 ? (
                    <div className='text-center py-8'>
                      <CalendarIcon className='w-12 h-12 text-gray-400 mx-auto mb-4' />
                      <p className='text-gray-500'>
                        No appointments scheduled for this day
                      </p>
                    </div>
                  ) : (
                    getAppointmentsForDate(selectedDate).map((appointment) => (
                      <div
                        key={appointment.id}
                        className='border rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors'
                        onClick={() => {
                          setSelectedAppointment(appointment);
                          setViewingAppointmentFromDate(true);
                        }}
                      >
                        <div className='flex items-start justify-between mb-2'>
                          <div className='flex items-center gap-2'>
                            <span className='font-medium text-gray-900'>
                              {appointment.service || 'Appointment'}
                            </span>
                            {!appointment.accountId && (
                              <AlertTriangleIcon className='w-4 h-4 text-amber-600' />
                            )}
                          </div>
                          {appointment.status && (
                            <Badge
                              variant='secondary'
                              className={clsx(
                                getStatusColor(appointment.status),
                                'text-xs'
                              )}
                            >
                              {capitalizeFirst(appointment.status)}
                            </Badge>
                          )}
                        </div>

                        <div className='flex items-center gap-4 text-sm text-gray-600'>
                          <div className='flex items-center gap-1'>
                            <ClockIcon className='w-4 h-4' />
                            <span>
                              {
                                formatDateTime(
                                  appointment.startAt || '',
                                  appointment.endAt
                                ).time
                              }
                            </span>
                          </div>
                          {appointment.accountName && (
                            <div className='flex items-center gap-1'>
                              <UserIcon className='w-4 h-4' />
                              <span>{appointment.accountName}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </>
          ) : (
            <>
              <DialogHeader>
                <div className='flex items-center gap-3'>
                  <Button
                    variant='ghost'
                    size='sm'
                    onClick={() => setViewingAppointmentFromDate(false)}
                  >
                    <ArrowLeft strokeWidth={2.5} className='w-4 h-4' />
                  </Button>
                  <DialogTitle className='text-xl'>
                    {selectedAppointment?.service || 'Appointment Details'}
                  </DialogTitle>
                </div>
              </DialogHeader>

              {selectedAppointment && (
                <div className='flex flex-col gap-4 mt-2'>
                  {selectedAppointment.status && (
                    <Badge
                      variant='secondary'
                      className={clsx(
                        getStatusColor(selectedAppointment.status),
                        'text-[13px] font-medium w-fit'
                      )}
                    >
                      {capitalizeFirst(selectedAppointment.status)}
                    </Badge>
                  )}

                  {!selectedAppointment.accountId && (
                    <div className='flex gap-3 border p-4 rounded-lg my-2'>
                      <TriangleAlertIcon
                        className='w-6 text-destructive'
                        strokeWidth={2.4}
                      />

                      <div>
                        <h4 className='text-[15px] font-semibold text-destructive mb-1'>
                          Client Not Synced
                        </h4>
                        <p className='text-sm text-destructive mb-4'>
                          This appointment has a customer which is not linked to
                          a CRM client.
                        </p>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button className='cursor-pointer'>
                              <span>Sync client</span>
                              <ChevronDownIcon />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align='start'>
                            <DropdownMenuItem onClick={handleCreateClient}>
                              Create new
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={handleLinkClient}>
                              Link to existing one
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  )}

                  <div className='flex items-center gap-3'>
                    <CalendarIcon className='w-5 h-5 text-neutral-500' />
                    <div className='flex flex-col'>
                      <span className='text-sm font-medium text-neutral-600'>
                        Date
                      </span>
                      <span className='text-[15px] text-neutral-900'>
                        {
                          formatDateTime(
                            selectedAppointment.startAt || '',
                            selectedAppointment.endAt
                          ).date
                        }
                      </span>
                    </div>
                  </div>

                  <div className='flex items-center gap-3'>
                    <ClockIcon className='w-5 h-5 text-neutral-500' />
                    <div className='flex flex-col'>
                      <span className='text-sm font-medium text-neutral-600'>
                        Time
                      </span>
                      <span className='text-[15px] text-neutral-900'>
                        {
                          formatDateTime(
                            selectedAppointment.startAt || '',
                            selectedAppointment.endAt
                          ).time
                        }{' '}
                        {selectedAppointment.durationMinutes && (
                          <>({selectedAppointment.durationMinutes} minutes)</>
                        )}
                      </span>
                    </div>
                  </div>

                  {selectedAppointment.accountName && (
                    <div className='flex items-center gap-3 w-full'>
                      <UserIcon className='w-5 h-5 text-neutral-500' />
                      <div className='flex flex-col w-full'>
                        <span className='text-sm font-medium text-neutral-600'>
                          Client
                        </span>
                        <Link
                          href={
                            selectedAppointment.accountId
                              ? `/clients/${selectedAppointment.accountId}`
                              : '#'
                          }
                          className={clsx('text-[15px] hover:underline', {
                            'text-purple cursor-pointer':
                              selectedAppointment.accountId,
                            'cursor-not-allowed':
                              !selectedAppointment.accountId,
                          })}
                        >
                          {selectedAppointment.accountName}
                        </Link>
                      </div>
                    </div>
                  )}

                  <div className='border-t pt-6 mt-3 text-sm text-neutral-500 flex flex-col gap-2'>
                    {selectedAppointment.createdBy && (
                      <p>Booked by: {selectedAppointment.createdBy}</p>
                    )}
                    {selectedAppointment.createdAt && (
                      <p>
                        Created on:{' '}
                        {new Date(
                          selectedAppointment.createdAt
                        ).toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>

      <CreateClientDialog
        open={isCreateClientDialogOpen}
        onOpenChange={setIsCreateClientDialogOpen}
        customerId={selectedAppointment?.customerId}
        customerName={selectedAppointment?.accountName}
        onSuccess={handleClientCreated}
      />

      <LinkClientDialog
        open={isLinkClientDialogOpen}
        onOpenChange={setIsLinkClientDialogOpen}
        onSelect={handleClientLinked}
        isLinking={syncAppointment.isPending}
        customerName={selectedAppointment?.accountName}
      />
    </>
  );
}
