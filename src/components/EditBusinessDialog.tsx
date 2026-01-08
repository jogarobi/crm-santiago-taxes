'use client';

import { useState, useEffect } from 'react';
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
import { useUpdateBusiness } from '@/hooks/use-businesses';
import { useBusinessEntities } from '@/hooks/use-business-entities';
import type { Business } from '@/lib/types/business';

interface EditBusinessDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accountId: number;
  business: Business | null;
}

export function EditBusinessDialog({
  open,
  onOpenChange,
  accountId,
  business,
}: EditBusinessDialogProps) {
  const updateBusiness = useUpdateBusiness();
  const { data: businessEntities, isLoading: entitiesLoading } =
    useBusinessEntities();
  const [error, setError] = useState<string | null>(null);
  const [datePickerOpen, setDatePickerOpen] = useState(false);

  const [formData, setFormData] = useState({
    registeredName: '',
    entityId: '',
    ein: '',
    address: '',
  });

  const [establishedDate, setEstablishedDate] = useState<Date | undefined>(
    undefined
  );

  // Initialize form data when business prop changes
  useEffect(() => {
    if (business) {
      setFormData({
        registeredName: business.registeredName || '',
        entityId: business.entityId?.toString() || '',
        ein: business.ein || '',
        address: business.address || '',
      });

      if (business.establishedDate) {
        setEstablishedDate(new Date(business.establishedDate));
      } else {
        setEstablishedDate(undefined);
      }
    }
  }, [business]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!business) return;

    if (!formData.registeredName) {
      setError('Please enter a business name');
      return;
    }

    try {
      await updateBusiness.mutateAsync({
        accountId,
        businessId: business.id,
        data: {
          registeredName: formData.registeredName,
          establishedDate: establishedDate
            ? establishedDate.toISOString().split('T')[0]
            : undefined,
          ein: formData.ein || undefined,
          address: formData.address || undefined,
          entityId: formData.entityId ? parseInt(formData.entityId) : undefined,
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
      <DialogContent className='max-w-2xl'>
        <DialogHeader>
          <DialogTitle className='text-xl'>Edit Business</DialogTitle>
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
              htmlFor='entityId'
              className='text-sm font-medium text-neutral-700'
            >
              Entity Type
            </Label>
            <Select
              value={formData.entityId}
              onValueChange={(value) => handleChange('entityId', value)}
              disabled={entitiesLoading}
            >
              <SelectTrigger id='entityId' className='w-full'>
                <SelectValue
                  placeholder={
                    entitiesLoading
                      ? 'Loading entity types...'
                      : 'Select entity type'
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {businessEntities?.map((entity) => (
                  <SelectItem key={entity.id} value={entity.id.toString()}>
                    {entity.name}
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
              disabled={updateBusiness.isPending}
            >
              Cancel
            </Button>
            <Button
              type='submit'
              className='bg-purple cursor-pointer'
              disabled={updateBusiness.isPending}
            >
              {updateBusiness.isPending ? (
                <>
                  <Loader2 className='w-4 h-4 animate-spin mr-2' />
                  Updating...
                </>
              ) : (
                'Update Business'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
