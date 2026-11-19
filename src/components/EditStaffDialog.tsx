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
import { Loader2, ChevronDown } from 'lucide-react';
import {
  useUpdateStaff,
  useChangeStaffPassword,
  type Staff,
} from '@/hooks/use-staff';
import { useCurrentUser } from '@/hooks/use-current-user';

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
  const changePassword = useChangeStaffPassword();
  const { data: currentUser } = useCurrentUser();
  const [error, setError] = useState<string | null>(null);

  const canChangePassword =
    (currentUser?.role === 'owner' || currentUser?.role === 'admin') &&
    !!staffMember?.userId;

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  const [showDetails, setShowDetails] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    role: 'staff',
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
        role: staffMember.role || 'staff',
        status: staffMember.status,
        email: staffMember.email || '',
        squareId: staffMember.squareId || '',
      });
      setPassword('');
      setConfirmPassword('');
      setPasswordError(null);
      setPasswordSuccess(false);
      setShowDetails(true);
      setShowPassword(false);
    }
  }, [staffMember]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!staffMember) {
      setError('No staff member selected');
      return;
    }

    if (!formData.firstName || !formData.lastName || !formData.role) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      await updateStaff.mutateAsync({
        id: staffMember.id,
        data: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          role: formData.role,
          status: formData.status,
          email: formData.email || undefined,
          squareId: formData.squareId || undefined,
        },
      });

      onOpenChange(false);
      onUpdateSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handlePasswordChange = async () => {
    setPasswordError(null);
    setPasswordSuccess(false);

    if (!staffMember) {
      setPasswordError('No staff member selected');
      return;
    }

    if (!password || !confirmPassword) {
      setPasswordError('Please fill in both password fields');
      return;
    }

    if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return;
    }

    if (password !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }

    try {
      await changePassword.mutateAsync({ id: staffMember.id, password });
      setPassword('');
      setConfirmPassword('');
      setPasswordSuccess(true);
    } catch (err) {
      setPasswordError(
        err instanceof Error ? err.message : 'Failed to change password'
      );
    }
  };

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleDialogOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setError(null);
      setPassword('');
      setConfirmPassword('');
      setPasswordError(null);
      setPasswordSuccess(false);
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent className='max-w-2xl'>
        <DialogHeader>
          <DialogTitle className='text-xl'>Edit Staff Member</DialogTitle>
        </DialogHeader>

        <form
          onSubmit={handleSubmit}
          className='flex flex-col gap-4 mt-4 max-h-[70vh] overflow-y-auto pr-1'
        >
          {error && (
            <div className='bg-red-50 border border-red-200 rounded-lg p-3'>
              <p className='text-red-800 text-sm'>{error}</p>
            </div>
          )}

          <button
            type='button'
            onClick={() => setShowDetails((v) => !v)}
            className='flex items-center justify-between w-full text-left'
          >
            <span className='text-sm font-semibold text-neutral-800'>
              Staff Details
            </span>
            <ChevronDown
              className={`w-4 h-4 text-neutral-500 transition-transform ${
                showDetails ? 'rotate-180' : ''
              }`}
            />
          </button>

          <div className={`flex-col gap-6 ${showDetails ? 'flex' : 'hidden'}`}>
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
              htmlFor='role'
              className='text-sm font-medium text-neutral-700'
            >
              Role <span className='text-red-500'>*</span>
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
          </div>

          {canChangePassword && (
            <div className='flex flex-col gap-4 pt-4 border-t'>
              <button
                type='button'
                onClick={() => setShowPassword((v) => !v)}
                className='flex items-center justify-between w-full text-left'
              >
                <div>
                  <h3 className='text-sm font-semibold text-neutral-800'>
                    Change Password
                  </h3>
                  <p className='text-xs text-neutral-500 mt-1'>
                    Set a new password for this staff member&apos;s account
                  </p>
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-neutral-500 transition-transform ${
                    showPassword ? 'rotate-180' : ''
                  }`}
                />
              </button>

              <div
                className={`flex-col gap-4 ${
                  showPassword ? 'flex' : 'hidden'
                }`}
              >
              {passwordError && (
                <div className='bg-red-50 border border-red-200 rounded-lg p-3'>
                  <p className='text-red-800 text-sm'>{passwordError}</p>
                </div>
              )}

              {passwordSuccess && (
                <div className='bg-green-50 border border-green-200 rounded-lg p-3'>
                  <p className='text-green-800 text-sm'>
                    Password updated successfully
                  </p>
                </div>
              )}

              <div className='grid grid-cols-2 gap-4'>
                <div className='flex flex-col gap-2'>
                  <Label
                    htmlFor='newPassword'
                    className='text-sm font-medium text-neutral-700'
                  >
                    New Password
                  </Label>
                  <Input
                    id='newPassword'
                    type='password'
                    value={password}
                    className='p-2'
                    autoComplete='new-password'
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder='••••••••'
                  />
                </div>

                <div className='flex flex-col gap-2'>
                  <Label
                    htmlFor='confirmPassword'
                    className='text-sm font-medium text-neutral-700'
                  >
                    Confirm Password
                  </Label>
                  <Input
                    id='confirmPassword'
                    type='password'
                    value={confirmPassword}
                    className='p-2'
                    autoComplete='new-password'
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder='••••••••'
                  />
                </div>
              </div>

              <div className='flex justify-end'>
                <Button
                  type='button'
                  variant='outline'
                  onClick={handlePasswordChange}
                  disabled={changePassword.isPending}
                >
                  {changePassword.isPending ? (
                    <>
                      <Loader2 className='w-4 h-4 animate-spin mr-2' />
                      Updating...
                    </>
                  ) : (
                    'Change Password'
                  )}
                </Button>
              </div>
              </div>
            </div>
          )}

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
