'use client';

import { use, useEffect } from 'react';
import { useAppointment, useCancelAppointment } from '@/lib/hooks/use-appointments';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  CalendarIcon,
  ClockIcon,
  Loader2,
  UserIcon,
  MapPinIcon,
  FileTextIcon,
  ArrowLeftIcon,
  XCircleIcon,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function AppointmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [isCanceling, setIsCanceling] = useState(false);

  const { data: appointment, isLoading, error } = useAppointment(id);
  const cancelAppointment = useCancelAppointment();

  // Set document title dynamically
  useEffect(() => {
    if (appointment?.id) {
      document.title = `Appointment #${appointment.id} | Santiago Taxes CRM`;
    }
  }, [appointment?.id]);

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    const dateFormatted = date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
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

  const handleCancel = async () => {
    if (!appointment?.id) return;

    if (
      !confirm(
        'Are you sure you want to cancel this appointment? This action cannot be undone.'
      )
    ) {
      return;
    }

    setIsCanceling(true);
    try {
      await cancelAppointment.mutateAsync({
        id: appointment.id,
        bookingVersion: appointment.version,
      });
      router.push('/dashboard/appointments');
    } catch (error) {
      console.error('Failed to cancel appointment:', error);
      alert('Failed to cancel appointment. Please try again.');
    } finally {
      setIsCanceling(false);
    }
  };

  if (isLoading) {
    return (
      <div className='flex items-center justify-center p-12'>
        <Loader2 className='w-8 h-8 animate-spin text-purple' />
        <span className='ml-3 text-neutral-600'>Loading appointment...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className='flex flex-col items-center gap-4 p-12'>
        <div className='bg-red-50 border border-red-200 rounded-lg p-6 max-w-md'>
          <p className='text-red-800 text-center'>
            Failed to load appointment details. Please try again later.
          </p>
        </div>
        <Link href='/dashboard/appointments'>
          <Button variant='outline'>
            <ArrowLeftIcon className='w-4 h-4' />
            <span>Back to Appointments</span>
          </Button>
        </Link>
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className='flex flex-col items-center gap-4 p-12'>
        <div className='bg-yellow-50 border border-yellow-200 rounded-lg p-6 max-w-md'>
          <p className='text-yellow-800 text-center'>Appointment not found</p>
        </div>
        <Link href='/dashboard/appointments'>
          <Button variant='outline'>
            <ArrowLeftIcon className='w-4 h-4' />
            <span>Back to Appointments</span>
          </Button>
        </Link>
      </div>
    );
  }

  const { date, time } = formatDateTime(appointment.startAt || '');

  return (
    <div className='flex flex-col gap-6 max-w-4xl'>
      {/* Header */}
      <div className='flex items-center gap-4'>
        <Link href='/dashboard/appointments'>
          <Button variant='outline' size='icon'>
            <ArrowLeftIcon className='w-4 h-4' />
          </Button>
        </Link>
        <div className='flex-1'>
          <h1 className='text-2xl font-semibold'>Appointment Details</h1>
          <p className='text-neutral-600 text-sm mt-1'>
            Booking ID: {appointment.id}
          </p>
        </div>
        {appointment.status !== ('CANCELLED' as any) && (
          <Button
            variant='outline'
            onClick={handleCancel}
            disabled={isCanceling}
            className='border-red-300 text-red-600 hover:bg-red-50'
          >
            {isCanceling ? (
              <>
                <Loader2 className='w-4 h-4 animate-spin' />
                <span>Canceling...</span>
              </>
            ) : (
              <>
                <XCircleIcon className='w-4 h-4' />
                <span>Cancel Appointment</span>
              </>
            )}
          </Button>
        )}
      </div>

      {/* Main Content */}
      <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
        {/* Date & Time */}
        <div className='bg-white border rounded-lg p-6'>
          <h2 className='text-lg font-semibold mb-4'>Date & Time</h2>
          <div className='space-y-3'>
            <div className='flex items-center gap-3'>
              <CalendarIcon className='w-5 h-5 text-purple' />
              <span className='font-medium'>{date}</span>
            </div>
            <div className='flex items-center gap-3'>
              <ClockIcon className='w-5 h-5 text-purple' />
              <span className='font-medium'>{time}</span>
            </div>
            {appointment.appointmentSegments &&
              appointment.appointmentSegments.length > 0 && (
                <div className='pt-2 border-t'>
                  <p className='text-sm text-neutral-600'>
                    Duration:{' '}
                    {appointment.appointmentSegments[0].durationMinutes} minutes
                  </p>
                </div>
              )}
          </div>
        </div>

        {/* Status */}
        <div className='bg-white border rounded-lg p-6'>
          <h2 className='text-lg font-semibold mb-4'>Status</h2>
          <Badge
            variant='secondary'
            className={`${getStatusColor(appointment.status)} text-base px-4 py-2`}
          >
            {appointment.status || 'UNKNOWN'}
          </Badge>
          {appointment.version && (
            <p className='text-sm text-neutral-600 mt-4'>
              Version: {appointment.version}
            </p>
          )}
        </div>

        {/* Customer Info */}
        {appointment.customerId && (
          <div className='bg-white border rounded-lg p-6'>
            <h2 className='text-lg font-semibold mb-4'>Customer</h2>
            <div className='flex items-center gap-3'>
              <UserIcon className='w-5 h-5 text-purple' />
              <div>
                <p className='font-medium'>Customer ID</p>
                <p className='text-sm text-neutral-600'>
                  {appointment.customerId}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Location */}
        {appointment.locationId && (
          <div className='bg-white border rounded-lg p-6'>
            <h2 className='text-lg font-semibold mb-4'>Location</h2>
            <div className='flex items-center gap-3'>
              <MapPinIcon className='w-5 h-5 text-purple' />
              <div>
                <p className='font-medium'>Location ID</p>
                <p className='text-sm text-neutral-600'>
                  {appointment.locationId}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Notes */}
      {(appointment.customerNote || appointment.sellerNote) && (
        <div className='bg-white border rounded-lg p-6'>
          <h2 className='text-lg font-semibold mb-4 flex items-center gap-2'>
            <FileTextIcon className='w-5 h-5 text-purple' />
            Notes
          </h2>
          <div className='space-y-4'>
            {appointment.customerNote && (
              <div>
                <p className='text-sm font-medium text-neutral-700 mb-1'>
                  Customer Note
                </p>
                <p className='text-neutral-600 bg-neutral-50 p-3 rounded'>
                  {appointment.customerNote}
                </p>
              </div>
            )}
            {appointment.sellerNote && (
              <div>
                <p className='text-sm font-medium text-neutral-700 mb-1'>
                  Internal Note
                </p>
                <p className='text-neutral-600 bg-neutral-50 p-3 rounded'>
                  {appointment.sellerNote}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Appointment Segments */}
      {appointment.appointmentSegments &&
        appointment.appointmentSegments.length > 0 && (
          <div className='bg-white border rounded-lg p-6'>
            <h2 className='text-lg font-semibold mb-4'>Services</h2>
            <div className='space-y-3'>
              {appointment.appointmentSegments.map((segment, index) => (
                <div key={index} className='border-l-4 border-purple pl-4'>
                  <div className='flex justify-between items-start'>
                    <div>
                      <p className='font-medium'>Service {index + 1}</p>
                      <p className='text-sm text-neutral-600'>
                        Service ID: {segment.serviceVariationId}
                      </p>
                      {segment.teamMemberId && (
                        <p className='text-sm text-neutral-600'>
                          Team Member: {segment.teamMemberId}
                        </p>
                      )}
                    </div>
                    <Badge variant='outline'>
                      {segment.durationMinutes} min
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      {/* Metadata */}
      <div className='bg-neutral-50 border rounded-lg p-6'>
        <h2 className='text-sm font-semibold text-neutral-700 mb-3'>
          Additional Information
        </h2>
        <div className='grid grid-cols-2 gap-4 text-sm'>
          {appointment.createdAt && (
            <div>
              <p className='text-neutral-600'>Created</p>
              <p className='font-medium'>
                {new Date(appointment.createdAt).toLocaleString()}
              </p>
            </div>
          )}
          {appointment.updatedAt && (
            <div>
              <p className='text-neutral-600'>Last Updated</p>
              <p className='font-medium'>
                {new Date(appointment.updatedAt).toLocaleString()}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
