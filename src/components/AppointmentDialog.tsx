'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAccounts } from '@/lib/hooks/use-accounts';
import {
  useCreateAppointment,
  useAvailability,
} from '@/lib/hooks/use-appointments';
import { useCatalogList } from '@/lib/hooks/use-catalog';
import type { Account } from '@/lib/types/account';
import { AlertCircle, CheckCircle2, Loader2, Search, X } from 'lucide-react';
import { useEffect, useState } from 'react';

interface AppointmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDateTime?: Date;
}

// Helper function to convert 24-hour time to 12-hour format with AM/PM
function formatTimeTo12Hour(time24: string): string {
  const [hours, minutes] = time24.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const hours12 = hours % 12 || 12;
  return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
}

export function AppointmentDialog({
  open,
  onOpenChange,
  selectedDateTime,
}: AppointmentDialogProps) {
  const [accountId, setAccountId] = useState<string>('');
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [accountSearch, setAccountSearch] = useState('');
  const [debouncedAccountSearch, setDebouncedAccountSearch] = useState('');
  const [showAccountDropdown, setShowAccountDropdown] = useState(false);
  const [serviceVariationId, setServiceVariationId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [initialTimeFromClick, setInitialTimeFromClick] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<boolean>(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedAccountSearch(accountSearch);
    }, 300);
    return () => clearTimeout(timer);
  }, [accountSearch]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.account-search-container')) {
        setShowAccountDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
        setInitialTimeFromClick(initialTime);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, selectedDateTime]);

  useEffect(() => {
    // Only clear time when date changes, but preserve time from initial click
    // Don't clear when only serviceVariationId changes to keep the clicked time
    if (selectedDate && !initialTimeFromClick) {
      setSelectedTime('');
    }
  }, [selectedDate, initialTimeFromClick]);

  const { data: accountsData, isLoading: isAccountsLoading } = useAccounts(
    debouncedAccountSearch
      ? { search: debouncedAccountSearch, onlyWithSquareId: true }
      : undefined
  );
  const { data: catalogItems, isLoading: isCatalogLoading } = useCatalogList();
  const { data: availableTimeSlots = [], isLoading: isLoadingAvailability } =
    useAvailability(
      selectedDate && serviceVariationId
        ? { selectedDate, serviceVariationId, teamMemberId: 'YG3C3GKYDQ23T' }
        : null
    );
  const createAppointment = useCreateAppointment();

  const handleAccountSelect = (account: Account) => {
    setSelectedAccount(account);
    setAccountId(account.squareId || '');
    setAccountSearch('');
    setShowAccountDropdown(false);
  };

  const handleClearAccount = () => {
    setSelectedAccount(null);
    setAccountId('');
    setAccountSearch('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!selectedDate || !selectedTime || !serviceVariationId) {
      setError('Please fill in all required fields');
      return;
    }

    const [year, month, day] = selectedDate.split('-').map(Number);
    const [hours, minutes] = selectedTime.split(':').map(Number);
    const bookingDateTime = new Date(
      year,
      month - 1,
      day,
      hours,
      minutes,
      0,
      0
    );

    try {
      const variations = catalogItems
        ?.filter((item) => item.type === 'ITEM')
        .flatMap((item) => item.itemData?.variations);

      const selectedItem = catalogItems
        ?.filter((item) => item.type === 'ITEM')
        .find((item) =>
          item.itemData?.variations?.some((v) => v.id === serviceVariationId)
        );
      const serviceName = selectedItem?.itemData?.name || undefined;

      await createAppointment.mutateAsync({
        startAt: bookingDateTime.toISOString(),
        customerId: accountId,
        customerNote: undefined,
        serviceName,
        appointmentSegments: [
          {
            durationMinutes: 30,
            serviceVariationId,
            teamMemberId: 'YG3C3GKYDQ23T',
            serviceVariationVersion: variations?.find(
              (variation) => variation?.id === serviceVariationId
            )?.version,
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
    setSelectedAccount(null);
    setAccountSearch('');
    setServiceVariationId('');
    setSelectedDate('');
    setSelectedTime('');
    setInitialTimeFromClick('');
    setError('');
    setSuccess(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-2xl max-h-[90vh] overflow-y-auto'>
        <DialogHeader className='mb-3'>
          <DialogTitle className='text-xl'>Schedule appointment</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className='flex flex-col gap-7'>
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

          <div className='w-full mt-3'>
            <Label htmlFor='service-variation-id' className='mb-2'>
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
                    return variations.map((variation) => {
                      return (
                        <SelectItem
                          key={variation.id}
                          value={variation.id || ''}
                        >
                          {item.itemData?.name}
                        </SelectItem>
                      );
                    });
                  })}
              </SelectContent>
            </Select>
          </div>

          <div className='relative account-search-container'>
            <Label htmlFor='client' className='mb-2'>
              Client
            </Label>
            {selectedAccount ? (
              <div className='flex items-center gap-2 p-3 border rounded-md bg-neutral-50'>
                <div className='flex-1'>
                  <p className='font-medium text-sm'>
                    {selectedAccount.firstName} {selectedAccount.lastName}
                  </p>
                  {selectedAccount.ssnLastFour && (
                    <Badge variant='secondary' className='text-xs mt-1'>
                      L4 SSN: {selectedAccount.ssnLastFour}
                    </Badge>
                  )}
                </div>
                <Button
                  type='button'
                  variant='ghost'
                  size='sm'
                  onClick={handleClearAccount}
                >
                  <X className='w-4 h-4' />
                </Button>
              </div>
            ) : (
              <>
                <InputGroup className='h-12'>
                  <InputGroupInput
                    id='client'
                    placeholder='Search for a client...'
                    value={accountSearch}
                    onChange={(e) => {
                      setAccountSearch(e.target.value);
                      setShowAccountDropdown(e.target.value.length > 0);
                    }}
                    onFocus={() =>
                      accountSearch.length > 0 && setShowAccountDropdown(true)
                    }
                  />
                  <InputGroupAddon>
                    {isAccountsLoading && debouncedAccountSearch ? (
                      <Loader2 className='animate-spin w-4 h-4' />
                    ) : (
                      <Search className='w-4 h-4' />
                    )}
                  </InputGroupAddon>
                </InputGroup>

                {showAccountDropdown && debouncedAccountSearch && (
                  <div className='absolute top-full left-0 right-0 mt-1 bg-white border rounded-lg shadow-lg max-h-64 overflow-y-auto z-50'>
                    {isAccountsLoading ? (
                      <div className='p-4 text-center text-sm text-neutral-500'>
                        Searching...
                      </div>
                    ) : accountsData?.data && accountsData.data.length > 0 ? (
                      <div className='py-2'>
                        <div className='px-4 py-2 text-sm text-neutral-500 font-medium'>
                          {accountsData.data.length} result
                          {accountsData.data.length !== 1 ? 's' : ''}
                        </div>
                        {accountsData.data.map((account) => (
                          <button
                            key={account.id}
                            type='button'
                            onClick={() => handleAccountSelect(account)}
                            className='w-full text-left px-4 py-3 hover:bg-neutral-50 transition-colors border-b last:border-b-0'
                          >
                            <div className='flex items-center gap-2'>
                              <p className='font-medium text-sm'>
                                {account.firstName} {account.lastName}
                              </p>
                              {account.ssnLastFour && (
                                <Badge variant='secondary' className='text-xs'>
                                  L4 SSN: {account.ssnLastFour}
                                </Badge>
                              )}
                            </div>
                            {account.address && (
                              <p className='text-xs text-neutral-600 mt-1'>
                                {account.address}
                                {account.city && `, ${account.city}`}
                                {account.state && `, ${account.state}`}
                              </p>
                            )}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className='p-4 text-center text-sm text-neutral-500'>
                        No clients found for &quot;{debouncedAccountSearch}
                        &quot;
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          <div className='flex items-center gap-4 w-full'>
            <div className='w-full '>
              <Label htmlFor='date' className='mb-2'>
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

            <div className='w-full '>
              <Label htmlFor='time' className='mb-2'>
                Time <span className='text-red-500'>*</span>
              </Label>
              <Select
                value={selectedTime}
                onValueChange={setSelectedTime}
                disabled={
                  isLoadingAvailability || !selectedDate || !serviceVariationId
                }
              >
                <SelectTrigger className='w-full' id='time'>
                  <SelectValue
                    placeholder={
                      isLoadingAvailability
                        ? 'Loading available times...'
                        : !selectedDate || !serviceVariationId
                        ? 'Select first'
                        : availableTimeSlots.length === 0
                        ? 'No available times'
                        : 'Select a time'
                    }
                  />
                </SelectTrigger>
                <SelectContent className='w-full'>
                  {availableTimeSlots.map((timeSlot) => (
                    <SelectItem key={timeSlot} value={timeSlot}>
                      {formatTimeTo12Hour(timeSlot)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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
