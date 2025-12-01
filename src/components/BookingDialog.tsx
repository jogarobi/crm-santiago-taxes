'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CalendarIcon, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAccounts } from '@/lib/hooks/use-accounts';
import { useCreateAppointment } from '@/lib/hooks/use-appointments';
import { useCatalogList } from '@/lib/hooks/use-catalog';

interface BookingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDateTime?: Date;
}

export function BookingDialog({
  open,
  onOpenChange,
  selectedDateTime,
}: BookingDialogProps) {
  const [accountId, setAccountId] = useState<string>('');
  const [serviceVariationId, setServiceVariationId] = useState<string>('');
  const [teamMemberId, setTeamMemberId] = useState<string>('');
  const [customerNote, setCustomerNote] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<boolean>(false);

  const locationId = process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID || '';

  // Initialize time from selectedDateTime when dialog opens
  useEffect(() => {
    if (open && selectedDateTime) {
      const hours = selectedDateTime.getHours().toString().padStart(2, '0');
      const minutes = selectedDateTime.getMinutes().toString().padStart(2, '0');
      const initialTime = `${hours}:${minutes}`;
      if (selectedTime !== initialTime) {
        setSelectedTime(initialTime);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, selectedDateTime]);

  const { data: accountsData } = useAccounts({ pageSize: 100 });
  const { data: catalogItems, isLoading: isCatalogLoading } = useCatalogList();
  const createAppointment = useCreateAppointment();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (
      !selectedDateTime ||
      !locationId ||
      !serviceVariationId ||
      !teamMemberId ||
      !selectedTime
    ) {
      setError('Please fill in all required fields');
      return;
    }

    const [hours, minutes] = selectedTime.split(':').map(Number);
    const bookingDateTime = new Date(selectedDateTime);
    bookingDateTime.setHours(hours, minutes, 0, 0);

    try {
      await createAppointment.mutateAsync({
        startAt: bookingDateTime.toISOString(),
        locationId,
        customerId: accountId || undefined,
        customerNote: customerNote || undefined,
        appointmentSegments: [
          {
            durationMinutes: 30,
            serviceVariationId,
            teamMemberId,
          },
        ],
      });

      setSuccess(true);
      setTimeout(() => {
        onOpenChange(false);
        resetForm();
      }, 1500);
    } catch (error) {
      console.error('Error creating booking:', error);
      setError(
        error instanceof Error
          ? error.message
          : 'Failed to create booking. Please try again.'
      );
    }
  };

  const resetForm = () => {
    setAccountId('');
    setServiceVariationId('');
    setTeamMemberId('');
    setCustomerNote('');
    setSelectedTime('');
    setError('');
    setSuccess(false);
  };

  const formatDateTime = (date: Date) => {
    return {
      date: date.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      }),
      time: date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      }),
    };
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-2xl max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle className='text-xl'>Schedule appointment</DialogTitle>
        </DialogHeader>

        {selectedDateTime && (
          <div className='flex flex-col gap-3 border-b pb-4 mb-2'>
            <div className='flex items-center gap-3'>
              <CalendarIcon className='w-5 h-5 text-neutral-500' />
              <div className='flex flex-col'>
                <span className='text-sm font-medium text-neutral-600'>
                  Date
                </span>
                <span className='text-[15px] text-neutral-900'>
                  {formatDateTime(selectedDateTime).date}
                </span>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className='space-y-4'>
          {error && (
            <div className='flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md'>
              <AlertCircle className='w-4 h-4 text-red-600' />
              <p className='text-sm text-red-600'>{error}</p>
            </div>
          )}

          {success && (
            <div className='flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-md'>
              <CheckCircle2 className='w-4 h-4 text-green-600' />
              <p className='text-sm text-green-600'>
                Booking created successfully!
              </p>
            </div>
          )}

          <div className='space-y-2'>
            <Label htmlFor='time'>
              Time <span className='text-red-500'>*</span>
            </Label>
            <Input
              id='time'
              type='time'
              value={selectedTime}
              onChange={(e) => setSelectedTime(e.target.value)}
              required
              className='p-3'
            />
          </div>

          <div className='space-y-2 w-full'>
            <Label htmlFor='service-variation-id'>
              Service <span className='text-red-500'>*</span>
            </Label>
            <Select
              value={serviceVariationId}
              onValueChange={setServiceVariationId}
              disabled={isCatalogLoading}
            >
              <SelectTrigger className='w-full' id='service-variation-id'>
                <SelectValue
                  placeholder={
                    isCatalogLoading
                      ? 'Loading services...'
                      : 'Select a service'
                  }
                />
              </SelectTrigger>
              <SelectContent className='w-full'>
                {catalogItems
                  ?.filter((item) => item.type === 'ITEM')
                  .map((item) => {
                    const variations = item.itemData?.variations || [];
                    return variations.map((variation) => (
                      <SelectItem key={variation.id} value={variation.id || ''}>
                        {item.itemData?.name}
                      </SelectItem>
                    ));
                  })}
              </SelectContent>
            </Select>
          </div>

          <div className='space-y-2'>
            <Label htmlFor='team-member-id'>
              Team Member ID <span className='text-red-500'>*</span>
            </Label>
            <Input
              id='team-member-id'
              value={teamMemberId}
              onChange={(e) => setTeamMemberId(e.target.value)}
              placeholder='Enter Team Member ID'
              required
            />
            <p className='text-xs text-muted-foreground'>
              The ID of the team member performing the service
            </p>
          </div>

          <div className='space-y-2'>
            <Label htmlFor='client'>Client (optional)</Label>
            <Select value={accountId} onValueChange={setAccountId}>
              <SelectTrigger id='client'>
                <SelectValue placeholder='Select a client' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='none'>No client</SelectItem>
                {accountsData?.data.map((account) => (
                  <SelectItem
                    key={account.id}
                    value={account.squareId || account.id?.toString() || ''}
                  >
                    {account.firstName} {account.lastName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className='space-y-2'>
            <Label htmlFor='customer-note'>Customer Note (optional)</Label>
            <Input
              id='customer-note'
              value={customerNote}
              onChange={(e) => setCustomerNote(e.target.value)}
              placeholder='Add a note for the customer'
            />
          </div>

          <div className='flex justify-end gap-3 pt-4'>
            <Button
              type='button'
              variant='outline'
              onClick={() => {
                onOpenChange(false);
                resetForm();
              }}
              disabled={createAppointment.isPending}
            >
              Cancel
            </Button>
            <Button
              type='submit'
              disabled={createAppointment.isPending}
              className='bg-purple hover:bg-purple/90'
            >
              {createAppointment.isPending ? (
                <>
                  <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                  Creating...
                </>
              ) : (
                'Create Booking'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
