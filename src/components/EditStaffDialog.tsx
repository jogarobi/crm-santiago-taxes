'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Loader2 } from 'lucide-react';
import { useUpdateStaff, type Staff } from '@/hooks/use-staff';

interface EditStaffDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  staffMember: Staff | null;
  onUpdateSuccess?: () => void;
}

export function EditStaffDialog({
  open,
  onOpenChange,
  staffMember,
  onUpdateSuccess,
}: EditStaffDialogProps) {
  const updateStaff = useUpdateStaff();
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    title: '',
    status: 'active',
    email: '',
    squareId: '',
  });

  // Update form when staff member changes
  useEffect(() => {
    if (staffMember) {
      setFormData({
        firstName: staffMember.firstName,
        lastName: staffMember.lastName,
        title: staffMember.title,
        status: staffMember.status,
        email: staffMember.email || '',
        squareId: staffMember.squareId || '',
      });
    }
  }, [staffMember]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!staffMember) {
      setError('No staff member selected');
      return;
    }

    if (!formData.firstName || !formData.lastName || !formData.title) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      await updateStaff.mutateAsync({
        id: staffMember.id,
        data: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          title: formData.title,
          status: formData.status,
          email: formData.email || undefined,
          squareId: formData.squareId || undefined,
          updatedBy: 'system', // TODO: Replace with actual user
        },
      });

      onOpenChange(false);
      onUpdateSuccess?.();
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
          <DialogTitle className='text-xl'>Edit Staff Member</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className='flex flex-col gap-6 mt-4'>
          {error && (
            <div className='bg-red-50 border border-red-200 rounded-lg p-3'>
              <p className='text-red-800 text-sm'>{error}</p>
            </div>
          )}

          <div className='grid grid-cols-2 gap-4'>
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
                value={formData.lastName}
                className='p-2'
                onChange={(e) => handleChange('lastName', e.target.value)}
                required
                placeholder='Doe'
              />
            </div>
          </div>

          <div className='flex flex-col gap-2'>
            <Label
              htmlFor='title'
              className='text-sm font-medium text-neutral-700'
            >
              Title <span className='text-red-500'>*</span>
            </Label>
            <Input
              id='title'
              value={formData.title}
              className='p-2'
              onChange={(e) => handleChange('title', e.target.value)}
              required
              placeholder='Tax Consultant'
            />
          </div>

          <div className='flex flex-col gap-2'>
            <Label
              htmlFor='email'
              className='text-sm font-medium text-neutral-700'
            >
              Email Address
            </Label>
            <Input
              id='email'
              type='email'
              value={formData.email}
              className='p-2'
              onChange={(e) => handleChange('email', e.target.value)}
              placeholder='john.doe@example.com'
            />
            <p className='text-xs text-neutral-500'>
              {staffMember?.userId
                ? 'This staff member is already linked to a user account'
                : 'Used to send organization invitation'}
            </p>
          </div>

          <div className='flex flex-col gap-2'>
            <Label
              htmlFor='status'
              className='text-sm font-medium text-neutral-700'
            >
              Status <span className='text-red-500'>*</span>
            </Label>
            <Select
              value={formData.status}
              onValueChange={(value) => handleChange('status', value)}
            >
              <SelectTrigger id='status' className='w-full'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='active'>Active</SelectItem>
                <SelectItem value='inactive'>Inactive</SelectItem>
                <SelectItem value='on-leave'>On Leave</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className='flex flex-col gap-2'>
            <Label
              htmlFor='squareId'
              className='text-sm font-medium text-neutral-700'
            >
              Square ID
            </Label>
            <Input
              id='squareId'
              value={formData.squareId}
              className='p-2'
              onChange={(e) => handleChange('squareId', e.target.value)}
              placeholder='Optional Square ID'
            />
          </div>

          <div className='flex gap-3 justify-end mt-4 pt-4 border-t'>
            <Button
              type='button'
              variant='outline'
              onClick={() => onOpenChange(false)}
              disabled={updateStaff.isPending}
            >
              Cancel
            </Button>
            <Button
              type='submit'
              className='bg-purple cursor-pointer'
              disabled={updateStaff.isPending}
            >
              {updateStaff.isPending ? (
                <>
                  <Loader2 className='w-4 h-4 animate-spin mr-2' />
                  Updating...
                </>
              ) : (
                'Update Staff Member'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
