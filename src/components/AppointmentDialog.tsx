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
import { useAccounts } from '@/hooks/use-accounts';
import {
  useCreateAppointment,
  useAvailability,
} from '@/hooks/use-appointments';
import { useCatalogList } from '@/hooks/use-catalog';
import { useTeamMembers } from '@/hooks/use-team';
import { useCurrentStaff } from '@/hooks/use-staff';
import type { Account } from '@/lib/types/account';
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Loader2,
  Plus,
  Search,
  X,
} from 'lucide-react';
import { useEffect, useState } from 'react';

interface AppointmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDateTime?: Date;
}

type SelectedSegment = {
  serviceVariationId: string;
  teamMemberId: string;
  durationMinutes: number;
  serviceVariationVersion: string | undefined;
  serviceName: string;
  price: number;
};

type ServiceOption = {
  variationId: string;
  serviceName: string;
  durationMinutes: number;
  version: string | undefined;
  price: number;
};

function formatTimeTo12Hour(time24: string): string {
  const [hours, minutes] = time24.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const hours12 = hours % 12 || 12;
  return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
}

function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
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
  const [selectedSegments, setSelectedSegments] = useState<SelectedSegment[]>(
    [],
  );
  const [showAddServices, setShowAddServices] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [initialTimeFromClick, setInitialTimeFromClick] = useState<string>('');
  const [selectedTeamMemberId, setSelectedTeamMemberId] = useState<string>('');
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
      const tzDate = new Date(selectedDateTime);
      const year = tzDate.getFullYear();
      const month = (tzDate.getMonth() + 1).toString().padStart(2, '0');
      const day = tzDate.getDate().toString().padStart(2, '0');
      const initialDate = `${year}-${month}-${day}`;
      const hours = tzDate.getHours().toString().padStart(2, '0');
      const minutes = tzDate.getMinutes().toString().padStart(2, '0');
      const initialTime = `${hours}:${minutes}`;
      if (selectedDate !== initialDate) setSelectedDate(initialDate);
      if (selectedTime !== initialTime) {
        setSelectedTime(initialTime);
        setInitialTimeFromClick(initialTime);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, selectedDateTime]);

  useEffect(() => {
    if (selectedDate && !initialTimeFromClick) {
      setSelectedTime('');
    }
  }, [selectedDate, initialTimeFromClick]);

  const { data: accountsData, isLoading: isAccountsLoading } = useAccounts(
    debouncedAccountSearch
      ? { search: debouncedAccountSearch, onlyWithSquareId: true }
      : undefined,
  );
  const { data: catalogItems, isLoading: isCatalogLoading } = useCatalogList();
  const { data: teamMembers = [] } = useTeamMembers();
  const { data: currentStaff } = useCurrentStaff();

  // Set default team member to current user once staff data loads, and sync segments
  useEffect(() => {
    if (currentStaff?.squareId && !selectedTeamMemberId) {
      setSelectedTeamMemberId(currentStaff.squareId);
      setSelectedSegments((prev) =>
        prev.map((s) => ({ ...s, teamMemberId: currentStaff.squareId! })),
      );
    } else if (teamMembers.length > 0 && !selectedTeamMemberId) {
      const id = teamMembers[0].id || '';
      setSelectedTeamMemberId(id);
      setSelectedSegments((prev) => prev.map((s) => ({ ...s, teamMemberId: id })));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStaff, teamMembers]);

  const appointmentServices: ServiceOption[] = (catalogItems || [])
    .filter((item) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const it = item as any;
      return (
        item.type === 'ITEM' &&
        it.itemData?.productType === 'APPOINTMENTS_SERVICE'
      );
    })
    .flatMap((item) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const it = item as any;
      const variations: any[] = it.itemData?.variations || [];
      return variations
        .filter((v: any) => v.itemVariationData?.serviceDuration)
        .map((v: any) => ({
          variationId: v.id || '',
          serviceName: it.itemData?.name || '',
          durationMinutes: Math.round(
            Number(v.itemVariationData?.serviceDuration || 0) / 60000,
          ),
          version: v.version?.toString(),
          price: Number(v.itemVariationData?.priceMoney?.amount || 0),
        }));
    });

  const availabilitySegments = selectedSegments.map((s) => ({
    serviceVariationId: s.serviceVariationId,
    teamMemberId: s.teamMemberId,
  }));

  const { data: availableTimeSlots = [], isLoading: isLoadingAvailability } =
    useAvailability(
      selectedDate && selectedSegments.length > 0
        ? { selectedDate, segments: availabilitySegments }
        : null,
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

  const handleTeamMemberChange = (memberId: string) => {
    setSelectedTeamMemberId(memberId);
    setSelectedSegments((prev) => prev.map((s) => ({ ...s, teamMemberId: memberId })));
    setSelectedTime('');
  };

  const addService = (service: ServiceOption) => {
    if (
      selectedSegments.some((s) => s.serviceVariationId === service.variationId)
    )
      return;
    setSelectedSegments((prev) => [
      ...prev,
      {
        serviceVariationId: service.variationId,
        teamMemberId: selectedTeamMemberId,
        durationMinutes: service.durationMinutes,
        serviceVariationVersion: service.version,
        serviceName: service.serviceName,
        price: service.price,
      },
    ]);
    setSelectedTime('');
  };

  const removeSegment = (index: number) => {
    setSelectedSegments((prev) => prev.filter((_, i) => i !== index));
    setSelectedTime('');
  };

  const getTeamMemberName = (id: string) => {
    const member = teamMembers.find((m) => m.id === id);
    if (!member) return '';
    return [member.givenName, member.familyName].filter(Boolean).join(' ');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!selectedDate || !selectedTime || selectedSegments.length === 0) {
      setError('Please select at least one service, a date, and a time');
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
      0,
    );

    try {
      const serviceNames = selectedSegments
        .map((s) => s.serviceName)
        .join(', ');

      await createAppointment.mutateAsync({
        startAt: bookingDateTime.toISOString(),
        customerId: accountId || undefined,
        customerNote: undefined,
        serviceName: serviceNames,
        appointmentSegments: selectedSegments.map((s) => ({
          durationMinutes: s.durationMinutes,
          serviceVariationId: s.serviceVariationId,
          teamMemberId: s.teamMemberId,
          serviceVariationVersion: s.serviceVariationVersion as
            | bigint
            | undefined,
        })),
      });

      setSuccess(true);
      setTimeout(() => {
        onOpenChange(false);
        resetForm();
      }, 1500);
    } catch (err) {
      console.error('Error creating appointment:', err);
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to create appointment. Please try again.',
      );
    }
  };

  const resetForm = () => {
    setAccountId('');
    setSelectedAccount(null);
    setAccountSearch('');
    setSelectedSegments([]);
    setShowAddServices(false);
    setSelectedDate('');
    setSelectedTime('');
    setInitialTimeFromClick('');
    setSelectedTeamMemberId(currentStaff?.squareId || teamMembers[0]?.id || '');
    setError('');
    setSuccess(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) resetForm();
        onOpenChange(isOpen);
      }}
    >
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
            <Label className='mb-3 block'>
              Services <span className='text-red-500'>*</span>
            </Label>

            {selectedSegments.length > 0 && (
              <div className='border rounded-lg mb-2 divide-y'>
                {selectedSegments.map((segment, index) => (
                  <div
                    key={segment.serviceVariationId}
                    className='flex items-start justify-between px-4 py-3'
                  >
                    <div>
                      <p className='font-semibold text-sm'>
                        {segment.serviceName}
                      </p>
                      {getTeamMemberName(segment.teamMemberId) && (
                        <p className='text-sm text-neutral-500'>
                          {getTeamMemberName(segment.teamMemberId)}
                        </p>
                      )}
                      <p className='text-sm text-neutral-500'>
                        {segment.durationMinutes} mins
                      </p>
                    </div>
                    <div className='flex items-center gap-3'>
                      <span className='text-sm font-medium'>
                        {formatPrice(segment.price)}
                      </span>
                      <Button
                        type='button'
                        variant='ghost'
                        size='sm'
                        onClick={() => removeSegment(index)}
                        className='h-6 w-6 p-0 text-neutral-400 hover:text-neutral-700'
                      >
                        <X className='w-4 h-4' />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <button
              type='button'
              onClick={() => setShowAddServices((v) => !v)}
              className='w-full flex items-center justify-between px-4 py-3 border rounded-lg text-sm font-medium hover:bg-neutral-50 transition-colors'
            >
              <span className='flex items-center gap-2'>
                <Plus className='w-4 h-4' />
                Add services
              </span>
              {showAddServices ? (
                <ChevronUp className='w-4 h-4 text-neutral-400' />
              ) : (
                <ChevronDown className='w-4 h-4 text-neutral-400' />
              )}
            </button>

            {showAddServices && (
              <div className='border border-t-0 rounded-b-lg shadow-sm'>
                {isCatalogLoading ? (
                  <div className='p-4 text-center text-sm text-neutral-500'>
                    <Loader2 className='w-4 h-4 animate-spin inline mr-2' />
                    Loading services...
                  </div>
                ) : appointmentServices.length === 0 ? (
                  <div className='p-4 text-center text-sm text-neutral-500'>
                    No appointment services found
                  </div>
                ) : (
                  <div className='px-4 pt-3 pb-1'>
                    <div className='overflow-y-auto max-h-56'>
                      {appointmentServices.map((service) => {
                        const alreadyAdded = selectedSegments.some(
                          (s) => s.serviceVariationId === service.variationId,
                        );
                        return (
                          <button
                            key={service.variationId}
                            type='button'
                            disabled={alreadyAdded}
                            onClick={() => addService(service)}
                            className='w-full flex items-center justify-between py-3 border-b last:border-b-0 text-left hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors'
                          >
                            <div>
                              <p className='font-semibold text-sm'>
                                {service.serviceName}
                              </p>
                              <p className='text-xs text-neutral-500'>
                                {service.durationMinutes} mins
                              </p>
                            </div>
                            <span className='text-sm font-medium'>
                              {formatPrice(service.price)}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Staff Member */}
          <div>
            <Label htmlFor='staff-member' className='mb-2'>
              Staff Member
            </Label>
            <Select
              value={selectedTeamMemberId || undefined}
              onValueChange={handleTeamMemberChange}
              disabled={teamMembers.length === 0}
            >
              <SelectTrigger id='staff-member' className='w-full'>
                <SelectValue placeholder='Select a staff member...' />
              </SelectTrigger>
              <SelectContent>
                {teamMembers.map((member) => {
                  const isCurrentUser = member.id === currentStaff?.squareId;
                  const name = [member.givenName, member.familyName].filter(Boolean).join(' ');
                  return (
                    <SelectItem key={member.id} value={member.id || ''}>
                      {name}{isCurrentUser ? ' (you)' : ''}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Client */}
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

          {/* Date and time */}
          <div className='flex items-center gap-4 w-full'>
            <div className='w-full'>
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

            <div className='w-full'>
              <Label htmlFor='time' className='mb-2'>
                Time <span className='text-red-500'>*</span>
              </Label>
              <Select
                value={selectedTime}
                onValueChange={setSelectedTime}
                disabled={
                  isLoadingAvailability ||
                  !selectedDate ||
                  selectedSegments.length === 0
                }
              >
                <SelectTrigger className='w-full' id='time'>
                  <SelectValue
                    placeholder={
                      isLoadingAvailability
                        ? 'Loading available times...'
                        : !selectedDate || selectedSegments.length === 0
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
