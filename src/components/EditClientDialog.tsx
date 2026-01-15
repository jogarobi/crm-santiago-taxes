'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Calendar } from './ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Loader2, ChevronDownIcon } from 'lucide-react';
import { useUpdateAccount } from '@/hooks/use-accounts';
import type { Account } from '@/lib/types/account';

const US_STATES = [
  { value: 'AL', label: 'Alabama' },
  { value: 'AK', label: 'Alaska' },
  { value: 'AZ', label: 'Arizona' },
  { value: 'AR', label: 'Arkansas' },
  { value: 'CA', label: 'California' },
  { value: 'CO', label: 'Colorado' },
  { value: 'CT', label: 'Connecticut' },
  { value: 'DE', label: 'Delaware' },
  { value: 'FL', label: 'Florida' },
  { value: 'GA', label: 'Georgia' },
  { value: 'HI', label: 'Hawaii' },
  { value: 'ID', label: 'Idaho' },
  { value: 'IL', label: 'Illinois' },
  { value: 'IN', label: 'Indiana' },
  { value: 'IA', label: 'Iowa' },
  { value: 'KS', label: 'Kansas' },
  { value: 'KY', label: 'Kentucky' },
  { value: 'LA', label: 'Louisiana' },
  { value: 'ME', label: 'Maine' },
  { value: 'MD', label: 'Maryland' },
  { value: 'MA', label: 'Massachusetts' },
  { value: 'MI', label: 'Michigan' },
  { value: 'MN', label: 'Minnesota' },
  { value: 'MS', label: 'Mississippi' },
  { value: 'MO', label: 'Missouri' },
  { value: 'MT', label: 'Montana' },
  { value: 'NE', label: 'Nebraska' },
  { value: 'NV', label: 'Nevada' },
  { value: 'NH', label: 'New Hampshire' },
  { value: 'NJ', label: 'New Jersey' },
  { value: 'NM', label: 'New Mexico' },
  { value: 'NY', label: 'New York' },
  { value: 'NC', label: 'North Carolina' },
  { value: 'ND', label: 'North Dakota' },
  { value: 'OH', label: 'Ohio' },
  { value: 'OK', label: 'Oklahoma' },
  { value: 'OR', label: 'Oregon' },
  { value: 'PA', label: 'Pennsylvania' },
  { value: 'RI', label: 'Rhode Island' },
  { value: 'SC', label: 'South Carolina' },
  { value: 'SD', label: 'South Dakota' },
  { value: 'TN', label: 'Tennessee' },
  { value: 'TX', label: 'Texas' },
  { value: 'UT', label: 'Utah' },
  { value: 'VT', label: 'Vermont' },
  { value: 'VA', label: 'Virginia' },
  { value: 'WA', label: 'Washington' },
  { value: 'WV', label: 'West Virginia' },
  { value: 'WI', label: 'Wisconsin' },
  { value: 'WY', label: 'Wyoming' },
  { value: 'DC', label: 'Washington DC' },
];

interface EditClientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  account: Account | null;
}

export function EditClientDialog({
  open,
  onOpenChange,
  account,
}: EditClientDialogProps) {
  const updateAccount = useUpdateAccount();
  const [error, setError] = useState<string | null>(null);
  const [datePickerOpen, setDatePickerOpen] = useState(false);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    ssnLastFour: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
  });

  const [dateOfBirth, setDateOfBirth] = useState<Date | undefined>(undefined);

  // Initialize form data when account prop changes
  useEffect(() => {
    if (account) {
      setFormData({
        firstName: account.firstName || '',
        lastName: account.lastName || '',
        ssnLastFour: account.ssnLastFour || '',
        address: account.address || '',
        city: account.city || '',
        state: account.state || '',
        zipCode: account.zipCode || '',
      });

      if (account.dateOfBirth) {
        setDateOfBirth(new Date(account.dateOfBirth));
      } else {
        setDateOfBirth(undefined);
      }
    }
  }, [account]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!account) return;

    if (!formData.firstName || !formData.lastName || !dateOfBirth) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      await updateAccount.mutateAsync({
        id: account.id,
        data: {
          ...formData,
          dateOfBirth: dateOfBirth.toISOString().split('T')[0],
          updatedBy: 'system', // TODO: Replace with actual user
        },
      });

      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleDialogOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setError(null);
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent className='max-w-2xl max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle className='text-xl'>Edit Client</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className='flex flex-col gap-6 mt-4'>
          {error && (
            <div className='bg-red-50 border border-red-200 rounded-lg p-3'>
              <p className='text-red-800 text-sm'>{error}</p>
            </div>
          )}

          <div className='grid grid-cols-2 gap-5'>
            <div className='flex flex-col gap-2'>
              <Label
                htmlFor='firstName'
                className='text-sm font-medium text-neutral-700'
              >
                First Name <span className='text-red-500'>*</span>
              </Label>
              <Input
                id='firstName'
                value={formData.firstName}
                className='p-2'
                onChange={(e) => handleChange('firstName', e.target.value)}
                required
                placeholder='John'
              />
            </div>

            <div className='flex flex-col gap-2'>
              <Label
                htmlFor='lastName'
                className='text-sm font-medium text-neutral-700'
              >
                Last Name <span className='text-red-500'>*</span>
              </Label>
              <Input
                id='lastName'
                className='p-2'
                value={formData.lastName}
                onChange={(e) => handleChange('lastName', e.target.value)}
                required
                placeholder='Doe'
              />
            </div>
          </div>

          <div className='flex flex-col gap-2'>
            <Label
              htmlFor='dateOfBirth'
              className='text-sm font-medium text-neutral-700'
            >
              Date of Birth <span className='text-red-500'>*</span>
            </Label>
            <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant='outline'
                  id='dateOfBirth'
                  className='justify-between font-normal'
                  type='button'
                >
                  {dateOfBirth
                    ? dateOfBirth.toLocaleDateString()
                    : 'Select date'}
                  <ChevronDownIcon />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className='w-auto overflow-hidden p-0'
                align='start'
              >
                <Calendar
                  mode='single'
                  selected={dateOfBirth}
                  captionLayout='dropdown'
                  startMonth={new Date(1900, 0)}
                  disabled={{ after: new Date() }}
                  onSelect={(date) => {
                    setDateOfBirth(date);
                    setDatePickerOpen(false);
                  }}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className='flex flex-col gap-2'>
            <Label
              htmlFor='ssnLastFour'
              className='text-sm font-medium text-neutral-700'
            >
              SSN (Last 4 digits)
            </Label>
            <Input
              id='ssnLastFour'
              value={formData.ssnLastFour}
              className='p-2'
              onChange={(e) => handleChange('ssnLastFour', e.target.value)}
              maxLength={4}
              pattern='[0-9]{4}'
            />
          </div>

          <div className='flex flex-col gap-2'>
            <Label
              htmlFor='address'
              className='text-sm font-medium text-neutral-700'
            >
              Address
            </Label>
            <Input
              id='address'
              className='p-2'
              value={formData.address}
              onChange={(e) => handleChange('address', e.target.value)}
            />
          </div>

          <div className='grid grid-cols-3 gap-5'>
            <div className='flex flex-col gap-2'>
              <Label
                htmlFor='city'
                className='text-sm font-medium text-neutral-700'
              >
                City
              </Label>
              <Input
                id='city'
                className='p-2'
                value={formData.city}
                onChange={(e) => handleChange('city', e.target.value)}
              />
            </div>

            <div className='flex flex-col gap-2'>
              <Label
                htmlFor='state'
                className='text-sm font-medium text-neutral-700'
              >
                State
              </Label>
              <Select
                value={formData.state}
                onValueChange={(value) => handleChange('state', value)}
              >
                <SelectTrigger id='state' className='w-full'>
                  <SelectValue placeholder='Select state' />
                </SelectTrigger>
                <SelectContent>
                  {US_STATES.map((state) => (
                    <SelectItem key={state.value} value={state.value}>
                      {state.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className='flex flex-col gap-2'>
              <Label
                htmlFor='zipCode'
                className='text-sm font-medium text-neutral-700'
              >
                Zip Code
              </Label>
              <Input
                id='zipCode'
                className='p-2'
                value={formData.zipCode}
                onChange={(e) => handleChange('zipCode', e.target.value)}
                maxLength={10}
              />
            </div>
          </div>

          <div className='flex gap-3 justify-end mt-4 pt-4 border-t'>
            <Button
              type='button'
              variant='outline'
              onClick={() => onOpenChange(false)}
              disabled={updateAccount.isPending}
            >
              Cancel
            </Button>
            <Button
              type='submit'
              className='bg-purple cursor-pointer'
              disabled={updateAccount.isPending}
            >
              {updateAccount.isPending ? (
                <>
                  <Loader2 className='w-4 h-4 animate-spin mr-2' />
                  Updating...
                </>
              ) : (
                'Update Client'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
