'use client';

import { useState } from 'react';
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
import { useCreateStaff } from '@/hooks/use-staff';

interface CreateStaffDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateSuccess?: (staffMember: {
    id: number;
    email?: string | null;
  }) => void;
}

export function CreateStaffDialog({
  open,
  onOpenChange,
  onCreateSuccess,
}: CreateStaffDialogProps) {
  const createStaff = useCreateStaff();
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    title: '',
    status: 'active',
    email: '',
    squareId: '',
    password: '',
    role: 'staff',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.firstName || !formData.lastName || !formData.title) {
      setError('Please fill in all required fields');
      return;
    }

    if (!formData.email) {
      setError('Email is required');
      return;
    }

    if (!formData.password || formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    try {
      const newStaff = await createStaff.mutateAsync({
        firstName: formData.firstName,
        lastName: formData.lastName,
        title: formData.title,
        status: formData.status,
        email: formData.email,
        squareId: formData.squareId || undefined,
        createdBy: 'system', // TODO: Replace with actual user
        createAccount: true,
        password: formData.password,
        role: formData.role,
      });

      onOpenChange(false);
      setFormData({
        firstName: '',
        lastName: '',
        title: '',
        status: 'active',
        email: '',
        squareId: '',
        password: '',
        role: 'staff',
      });

      onCreateSuccess?.(newStaff);
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
        firstName: '',
        lastName: '',
        title: '',
        status: 'active',
        email: '',
        squareId: '',
        password: '',
        role: 'staff',
      });
      setError(null);
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent className='max-w-2xl'>
        <DialogHeader>
          <DialogTitle className='text-xl'>Create New Staff Member</DialogTitle>
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

          <div className='flex items-center gap-4'>
            <div className='flex flex-col gap-2 w-full'>
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

            <div className='flex flex-col gap-2 w-full'>
              <Label
                htmlFor='email'
                className='text-sm font-medium text-neutral-700'
              >
                Email Address <span className='text-red-500'>*</span>
              </Label>
              <Input
                id='email'
                type='email'
                value={formData.email}
                className='p-2'
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder='john.doe@example.com'
                required
              />
            </div>
          </div>

          <div className='grid grid-cols-2 gap-4'>
            <div className='flex flex-col gap-2'>
              <Label
                htmlFor='password'
                className='text-sm font-medium text-neutral-700'
              >
                Password <span className='text-red-500'>*</span>
              </Label>
              <Input
                id='password'
                type='password'
                value={formData.password}
                className='p-2'
                onChange={(e) => handleChange('password', e.target.value)}
                placeholder='Minimum 8 characters'
                required
              />
              <p className='text-xs text-neutral-500'>
                Must be at least 8 characters
              </p>
            </div>

            <div className='flex flex-col gap-2'>
              <Label
                htmlFor='role'
                className='text-sm font-medium text-neutral-700'
              >
                Account Role <span className='text-red-500'>*</span>
              </Label>
              <Select
                value={formData.role}
                onValueChange={(value) => handleChange('role', value)}
              >
                <SelectTrigger id='role' className='w-full'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='staff'>Staff</SelectItem>
                  <SelectItem value='admin'>Admin</SelectItem>
                  <SelectItem value='owner'>Owner</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className='flex items-center gap-4'>
            <div className='flex flex-col gap-2 w-full'>
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

            <div className='flex flex-col gap-2 w-full'>
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
          </div>

          <div className='flex gap-3 justify-end mt-4 pt-4 border-t'>
            <Button
              type='button'
              variant='outline'
              onClick={() => onOpenChange(false)}
              disabled={createStaff.isPending}
            >
              Cancel
            </Button>
            <Button
              type='submit'
              className='bg-purple cursor-pointer'
              disabled={createStaff.isPending}
            >
              {createStaff.isPending ? (
                <>
                  <Loader2 className='w-4 h-4 animate-spin mr-2' />
                  Creating...
                </>
              ) : (
                'Create Staff Member'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
