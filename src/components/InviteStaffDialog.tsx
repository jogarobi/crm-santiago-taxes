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
import { authClient } from '@/app/api/clients';

interface InviteStaffDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInviteSuccess?: () => void;
  defaultEmail?: string;
}

export function InviteStaffDialog({
  open,
  onOpenChange,
  onInviteSuccess,
  defaultEmail = '',
}: InviteStaffDialogProps) {
  const [email, setEmail] = useState(defaultEmail);
  const [role, setRole] = useState('member');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (defaultEmail) {
      setEmail(defaultEmail);
    }
  }, [defaultEmail]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    setIsLoading(true);

    try {
      await authClient.organization.inviteMember({
        email,
        role,
      });

      setSuccess(true);
      setEmail('');
      setRole('member');

      // Show success message briefly before closing
      setTimeout(() => {
        onOpenChange(false);
        setSuccess(false);
        onInviteSuccess?.();
      }, 1500);
    } catch (err: any) {
      setError(
        err?.message || 'Failed to send invitation. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleDialogOpenChange = (newOpen: boolean) => {
    if (!newOpen && !isLoading) {
      setEmail('');
      setRole('member');
      setError(null);
      setSuccess(false);
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent className='max-w-md'>
        <DialogHeader>
          <DialogTitle className='text-xl'>Invite Staff Member</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className='flex flex-col gap-6 mt-4'>
          {error && (
            <div className='bg-red-50 border border-red-200 rounded-lg p-3'>
              <p className='text-red-800 text-sm'>{error}</p>
            </div>
          )}

          {success && (
            <div className='bg-green-50 border border-green-200 rounded-lg p-3'>
              <p className='text-green-800 text-sm'>
                Invitation sent successfully!
              </p>
            </div>
          )}

          <div className='flex flex-col gap-2'>
            <Label
              htmlFor='email'
              className='text-sm font-medium text-neutral-700'
            >
              Email Address <span className='text-red-500'>*</span>
            </Label>
            <Input
              id='email'
              type='email'
              value={email}
              className='p-2'
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder='colleague@example.com'
              disabled={isLoading || success}
            />
            <p className='text-xs text-neutral-500'>
              An invitation email will be sent to this address
            </p>
          </div>

          <div className='flex flex-col gap-2'>
            <Label htmlFor='role' className='text-sm font-medium text-neutral-700'>
              Role <span className='text-red-500'>*</span>
            </Label>
            <Select
              value={role}
              onValueChange={setRole}
              disabled={isLoading || success}
            >
              <SelectTrigger id='role' className='w-full'>
                <SelectValue placeholder='Select a role' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='member'>Member</SelectItem>
                <SelectItem value='admin'>Admin</SelectItem>
                <SelectItem value='owner'>Owner</SelectItem>
              </SelectContent>
            </Select>
            <p className='text-xs text-neutral-500'>
              Select the role for this staff member
            </p>
          </div>

          <div className='flex gap-3 justify-end mt-4 pt-4 border-t'>
            <Button
              type='button'
              variant='outline'
              onClick={() => onOpenChange(false)}
              disabled={isLoading || success}
            >
              Cancel
            </Button>
            <Button
              type='submit'
              className='bg-purple cursor-pointer'
              disabled={isLoading || success}
            >
              {isLoading ? (
                <>
                  <Loader2 className='w-4 h-4 animate-spin mr-2' />
                  Sending...
                </>
              ) : success ? (
                'Sent!'
              ) : (
                'Send Invitation'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
