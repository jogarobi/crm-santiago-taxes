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
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAccounts } from '@/lib/hooks/use-accounts';
import { useCreateAppointment } from '@/lib/hooks/use-appointments';
import { useCatalogList } from '@/lib/hooks/use-catalog';
import { useTeamMembers } from '@/lib/hooks/use-team';

interface AppointmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDateTime?: Date;
}

export function AppointmentDialog({
  open,
  onOpenChange,
  selectedDateTime,
}: AppointmentDialogProps) {
  const [accountId, setAccountId] = useState<string>('');
  const [serviceVariationId, setServiceVariationId] = useState<string>('');
  const [teamMemberId, setTeamMemberId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<boolean>(false);

  const locationId = process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID || '';

  useEffect(() => {
    if (open && selectedDateTime) {
      const year = selectedDateTime.getFullYear();
      const month = (selectedDateTime.getMonth() + 1)
        .toString()
        .padStart(2, '0');
      const day = selectedDateTime.getDate().toString().padStart(2, '0');
      const initialDate = `${year}-${month}-${day}`;

      const hours = selectedDateTime.getHours().toString().padStart(2, '0');
      const minutes = selectedDateTime.getMinutes().toString().padStart(2, '0');
      const initialTime = `${hours}:${minutes}`;

      if (selectedDate !== initialDate) {
        setSelectedDate(initialDate);
      }
      if (selectedTime !== initialTime) {
        setSelectedTime(initialTime);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, selectedDateTime]);

  const { data: accountsData } = useAccounts({ pageSize: 100 });
  const { data: catalogItems, isLoading: isCatalogLoading } = useCatalogList();
  const { data: teamMembers, isLoading: isTeamLoading } = useTeamMembers();
  const createAppointment = useCreateAppointment();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (
      !selectedDate ||
      !selectedTime ||
      !locationId ||
      !serviceVariationId ||
      !teamMemberId
    ) {
      setError('Please fill in all required fields');
      return;
    }

    const [hours, minutes] = selectedTime.split(':').map(Number);
    const bookingDateTime = new Date(selectedDate);
    bookingDateTime.setHours(hours, minutes, 0, 0);

    try {
      await createAppointment.mutateAsync({
        startAt: bookingDateTime.toISOString(),
        locationId,
        customerId: accountId || undefined,
        customerNote: undefined,
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
      console.error('Error creating appointment:', error);
      setError(
        error instanceof Error
          ? error.message
          : 'Failed to create appointment. Please try again.'
      );
    }
  };

  const resetForm = () => {
    setAccountId('');
    setServiceVariationId('');
    setTeamMemberId('');
    setSelectedDate('');
    setSelectedTime('');
    setError('');
    setSuccess(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-2xl max-h-[90vh] overflow-y-auto'>
        <DialogHeader className='mb-3'>
          <DialogTitle className='text-xl'>Schedule appointment</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className='flex flex-col gap-4'>
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
                Appointment created successfully!
              </p>
            </div>
          )}

          <div className='flex items-center gap-4 w-full'>
            <div className='w-full space-y-3'>
              <Label htmlFor='date'>
                Date <span className='text-red-500'>*</span>
              </Label>
              <Input
                id='date'
                type='date'
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                required
                className='p-3 w-full'
              />
            </div>

            <div className='w-full space-y-3'>
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
          </div>

          <div className='w-full space-y-3 mt-3'>
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

          <div className='space-y-3'>
            <Label htmlFor='team-member-id'>
              Team Member <span className='text-red-500'>*</span>
            </Label>
            <Select
              value={teamMemberId}
              onValueChange={setTeamMemberId}
              disabled={isTeamLoading}
            >
              <SelectTrigger id='team-member-id' className='w-full'>
                <SelectValue
                  placeholder={
                    isTeamLoading
                      ? 'Loading team members...'
                      : 'Select a team member'
                  }
                />
              </SelectTrigger>
              <SelectContent className='w-full'>
                {teamMembers?.map((member) => (
                  <SelectItem key={member.id} value={member.id || ''}>
                    {member.givenName} {member.familyName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className='space-y-3'>
            <Label htmlFor='client'>Client</Label>
            <Select value={accountId} onValueChange={setAccountId}>
              <SelectTrigger id='client' className='w-full'>
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
                'Schedule Appointment'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
