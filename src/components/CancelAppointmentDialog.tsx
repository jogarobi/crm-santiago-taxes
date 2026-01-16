'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';
import { Loader2 } from 'lucide-react';
import { useCancelAppointment } from '@/hooks/use-appointments';
import type { Appointment } from '@/lib/types/appointment';
import { format } from 'date-fns';

interface CancelAppointmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointment: Appointment | null;
}

export function CancelAppointmentDialog({
  open,
  onOpenChange,
  appointment,
}: CancelAppointmentDialogProps) {
  const cancelAppointment = useCancelAppointment();

  const handleCancel = async () => {
    if (!appointment?.id) return;

    try {
      await cancelAppointment.mutateAsync({
        id: appointment.id,
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Error cancelling appointment:', error);
    }
  };

  const formatAppointmentDetails = () => {
    if (!appointment) return '';

    const startDate = appointment.startAt ? new Date(appointment.startAt) : null;
    const endDate = appointment.endAt ? new Date(appointment.endAt) : null;

    if (!startDate) return '';

    const dateStr = format(startDate, 'EEEE, MMMM d, yyyy');
    const timeStr = endDate
      ? `${format(startDate, 'h:mm a')} - ${format(endDate, 'h:mm a')}`
      : format(startDate, 'h:mm a');

    return `${dateStr} at ${timeStr}`;
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Cancel Appointment</AlertDialogTitle>
          <AlertDialogDescription className='text-neutral-600 text-[15px]'>
            Are you sure you want to cancel this appointment?
          </AlertDialogDescription>
          {appointment && (
            <div className='mt-3 space-y-1 text-[15px] text-neutral-600'>
              {appointment.service && (
                <div>
                  <span className='font-semibold'>Service:</span>{' '}
                  {appointment.service}
                </div>
              )}
              {appointment.accountName && (
                <div>
                  <span className='font-semibold'>Client:</span>{' '}
                  {appointment.accountName}
                </div>
              )}
              <div>
                <span className='font-semibold'>When:</span>{' '}
                {formatAppointmentDetails()}
              </div>
            </div>
          )}
          <div className='mt-3 text-red-600 font-medium text-[15px]'>
            This action cannot be undone.
          </div>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={cancelAppointment.isPending}>
            Keep Appointment
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleCancel}
            disabled={cancelAppointment.isPending}
            className='bg-red-600 hover:bg-red-700'
          >
            {cancelAppointment.isPending ? (
              <>
                <Loader2 className='w-4 h-4 animate-spin mr-2' />
                Cancelling...
              </>
            ) : (
              'Cancel Appointment'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
