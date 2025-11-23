'use client';

import { useMemo, useState } from 'react';
import {
  useAppointments,
  useSyncAppointment,
} from '@/lib/hooks/use-appointments';
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
  UserIcon,
  AlertTriangleIcon,
  TriangleAlertIcon,
  ChevronDownIcon,
} from 'lucide-react';
import Link from 'next/link';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Appointment } from '@/lib/types/appointment';
import clsx from 'clsx';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { CreateClientDialog } from './CreateClientDialog';
import { LinkClientDialog } from './LinkClientDialog';

export function UpcomingAppointments() {
  const [selectedAppointment, setSelectedAppointment] =
    useState<Appointment | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCreateClientDialogOpen, setIsCreateClientDialogOpen] =
    useState(false);
  const [isLinkClientDialogOpen, setIsLinkClientDialogOpen] = useState(false);
  const syncAppointment = useSyncAppointment();

  const dateRange = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 14);
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
    startAt: string,
    endAt?: string
  ): { date: string; time: string } => {
    const startDate = new Date(startAt);

    const relativeDate = getRelativeDate(startAt);

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

  const handleAppointmentClick = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setIsDialogOpen(true);
  };

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
      alert('Client created but failed to sync with appointment');
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
      alert('Failed to link appointment to client');
    }
  };

  return (
    <>
      <div className='mt-4 flex flex-col gap-5'>
        {upcomingAppointments.map((appointment) => {
          const { date, time } = formatDateTime(
            appointment.startAt || '',
            appointment.endAt
          );

          return (
            <div
              key={appointment.id}
              onClick={() => handleAppointmentClick(appointment)}
              className='block bg-white border rounded-lg p-4 hover:shadow-xs transition-shadow cursor-pointer'
            >
              <div className='flex items-start justify-between'>
                <div className='flex-1'>
                  <div className='flex items-center gap-3 justify-between mb-2'>
                    <div className='flex items-center gap-2'>
                      {appointment.service && (
                        <div className='font-semibold text-neutral-900'>
                          {appointment.service}
                        </div>
                      )}
                      {!appointment.accountId && (
                        <div className='flex items-center gap-1 text-amber-600'>
                          <AlertTriangleIcon className='w-4 h-4' />
                        </div>
                      )}
                    </div>

                    {appointment.status && (
                      <Badge
                        variant='secondary'
                        className={clsx(
                          getStatusColor(appointment.status),
                          'text-[13px] font-medium mb-2'
                        )}
                      >
                        {capitalizeFirst(appointment.status)}
                      </Badge>
                    )}
                  </div>

                  <div className='mb-3 flex items-center gap-2 flex-wrap'>
                    {appointment.accountName && (
                      <span className='text-[15px] text-neutral-700'>
                        {appointment.accountName}
                      </span>
                    )}
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
                </div>
              </div>
            </div>
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
                    'text-[13px] font-medium'
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
                    ({selectedAppointment.durationMinutes} minutes)
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
