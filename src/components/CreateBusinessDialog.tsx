'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
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
import { useCreateBusiness } from '@/hooks/use-businesses';

interface CreateBusinessDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accountId: number;
}

const BUSINESS_ENTITY_TYPES = [
  { value: 'sole-proprietor', label: 'Sole Proprietor' },
  { value: 'llc', label: 'LLC (Limited Liability Company)' },
  { value: 'corporation', label: 'C Corporation' },
  { value: 's-corporation', label: 'S Corporation' },
  { value: 'partnership', label: 'Partnership' },
  { value: 'non-profit', label: 'Non-Profit' },
];

export function CreateBusinessDialog({
  open,
  onOpenChange,
  accountId,
}: CreateBusinessDialogProps) {
  const createBusiness = useCreateBusiness();
  const [error, setError] = useState<string | null>(null);
  const [datePickerOpen, setDatePickerOpen] = useState(false);

  const [formData, setFormData] = useState({
    registeredName: '',
    entityType: '',
    ein: '',
    address: '',
  });

  const [establishedDate, setEstablishedDate] = useState<Date | undefined>(
    undefined
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.registeredName) {
      setError('Please enter a business name');
      return;
    }

    try {
      await createBusiness.mutateAsync({
        accountId,
        data: {
          registeredName: formData.registeredName,
          establishedDate: establishedDate
            ? establishedDate.toISOString().split('T')[0]
            : undefined,
          ein: formData.ein || undefined,
          address: formData.address || undefined,
          createdBy: 'system', // TODO: Replace with actual user
        },
      });

      onOpenChange(false);
      setFormData({
        registeredName: '',
        entityType: '',
        ein: '',
        address: '',
      });
      setEstablishedDate(undefined);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleDialogOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setFormData({
        registeredName: '',
        entityType: '',
        ein: '',
        address: '',
      });
      setEstablishedDate(undefined);
      setError(null);
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent className='max-w-2xl'>
        <DialogHeader>
          <DialogTitle className='text-xl'>Create New Business</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className='flex flex-col gap-6 mt-4'>
          {error && (
            <div className='bg-red-50 border border-red-200 rounded-lg p-3'>
              <p className='text-red-800 text-sm'>{error}</p>
            </div>
          )}

          <div className='flex flex-col gap-2'>
            <Label
              htmlFor='registeredName'
              className='text-sm font-medium text-neutral-700'
            >
              Business Name <span className='text-red-500'>*</span>
            </Label>
            <Input
              id='registeredName'
              value={formData.registeredName}
              className='p-2'
              onChange={(e) => handleChange('registeredName', e.target.value)}
              required
              placeholder='Enter business name'
            />
          </div>

          <div className='flex flex-col gap-2'>
            <Label
              htmlFor='entityType'
              className='text-sm font-medium text-neutral-700'
            >
              Entity Type
            </Label>
            <Select
              value={formData.entityType}
              onValueChange={(value) => handleChange('entityType', value)}
            >
              <SelectTrigger id='entityType' className='w-full'>
                <SelectValue placeholder='Select entity type' />
              </SelectTrigger>
              <SelectContent>
                {BUSINESS_ENTITY_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className='flex flex-col gap-2'>
            <Label
              htmlFor='establishedDate'
              className='text-sm font-medium text-neutral-700'
            >
              Established Date
            </Label>
            <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant='outline'
                  id='establishedDate'
                  className='justify-between font-normal'
                  type='button'
                >
                  {establishedDate
                    ? establishedDate.toLocaleDateString()
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
                  selected={establishedDate}
                  captionLayout='dropdown'
                  startMonth={new Date(1900, 0)}
                  disabled={{ after: new Date() }}
                  onSelect={(date) => {
                    setEstablishedDate(date);
                    setDatePickerOpen(false);
                  }}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className='flex flex-col gap-2'>
            <Label
              htmlFor='ein'
              className='text-sm font-medium text-neutral-700'
            >
              EIN (Employer Identification Number)
            </Label>
            <Input
              id='ein'
              value={formData.ein}
              className='p-2'
              onChange={(e) => handleChange('ein', e.target.value)}
              placeholder='XX-XXXXXXX'
              maxLength={10}
            />
          </div>

          <div className='flex flex-col gap-2'>
            <Label
              htmlFor='address'
              className='text-sm font-medium text-neutral-700'
            >
              Business Address
            </Label>
            <Input
              id='address'
              value={formData.address}
              className='p-2'
              onChange={(e) => handleChange('address', e.target.value)}
              placeholder='Enter business address'
            />
          </div>

          <div className='flex gap-3 justify-end mt-4 pt-4 border-t'>
            <Button
              type='button'
              variant='outline'
              onClick={() => onOpenChange(false)}
              disabled={createBusiness.isPending}
            >
              Cancel
            </Button>
            <Button
              type='submit'
              className='bg-purple cursor-pointer'
              disabled={createBusiness.isPending}
            >
              {createBusiness.isPending ? (
                <>
                  <Loader2 className='w-4 h-4 animate-spin mr-2' />
                  Creating...
                </>
              ) : (
                'Create Business'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
