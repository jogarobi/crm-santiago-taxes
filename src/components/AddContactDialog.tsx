'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Label } from './ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Loader2 } from 'lucide-react';
import { useCreateAccountContact } from '@/hooks/use-account-contact';

interface AddContactDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accountId: number;
}

export function AddContactDialog({
  open,
  onOpenChange,
  accountId,
}: AddContactDialogProps) {
  const createContact = useCreateAccountContact();
  const [error, setError] = useState<string | null>(null);
  const [contactType, setContactType] = useState<'email' | 'phone'>('email');
  const [contactValue, setContactValue] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!contactValue.trim()) {
      setError(`Please provide a ${contactType === 'email' ? 'email' : 'phone number'}`);
      return;
    }

    try {
      await createContact.mutateAsync({
        accountId,
        email: contactType === 'email' ? contactValue : undefined,
        phoneNumber: contactType === 'phone' ? contactValue : undefined,
        createdBy: 'system', // TODO: Replace with actual user
      });

      setContactValue('');
      setContactType('email');
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleDialogOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setError(null);
      setContactValue('');
      setContactType('email');
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent className='max-w-md'>
        <DialogHeader>
          <DialogTitle className='text-xl'>Add Contact</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className='flex flex-col gap-6 mt-4'>
          {error && (
            <div className='bg-red-50 border border-red-200 rounded-lg p-3'>
              <p className='text-red-800 text-sm'>{error}</p>
            </div>
          )}

          <div className='flex flex-col gap-2'>
            <Label
              htmlFor='contactType'
              className='text-sm font-medium text-neutral-700'
            >
              Contact Type
            </Label>
            <Select
              value={contactType}
              onValueChange={(value) => {
                setContactType(value as 'email' | 'phone');
                setContactValue('');
              }}
            >
              <SelectTrigger id='contactType' className='w-full'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='email'>Email</SelectItem>
                <SelectItem value='phone'>Phone Number</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className='flex flex-col gap-2'>
            <Label
              htmlFor='contactValue'
              className='text-sm font-medium text-neutral-700'
            >
              {contactType === 'email' ? 'Email Address' : 'Phone Number'}
            </Label>
            <Input
              id='contactValue'
              type={contactType === 'email' ? 'email' : 'tel'}
              value={contactValue}
              className='p-2'
              onChange={(e) => setContactValue(e.target.value)}
              placeholder={contactType === 'email' ? 'contact@example.com' : '(555) 123-4567'}
            />
          </div>

          <div className='flex gap-3 justify-end mt-4 pt-4 border-t'>
            <Button
              type='button'
              variant='outline'
              onClick={() => onOpenChange(false)}
              disabled={createContact.isPending}
            >
              Cancel
            </Button>
            <Button
              type='submit'
              className='bg-purple cursor-pointer'
              disabled={createContact.isPending}
            >
              {createContact.isPending ? (
                <>
                  <Loader2 className='w-4 h-4 animate-spin mr-2' />
                  Adding...
                </>
              ) : (
                'Add Contact'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
