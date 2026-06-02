'use client';

import { useState, useEffect } from 'react';
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
import { useUpdateAccountContact } from '@/hooks/use-account-contact';
import type { AccountContact } from '@/lib/types/account-contact';
import { authClient } from '@/app/api/clients';

interface EditContactDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accountId: number;
  contact: AccountContact | null;
}

export function EditContactDialog({
  open,
  onOpenChange,
  accountId,
  contact,
}: EditContactDialogProps) {
  const updateContact = useUpdateAccountContact();
  const { data: session } = authClient.useSession();
  const [error, setError] = useState<string | null>(null);
  const [contactType, setContactType] = useState<'email' | 'phone'>('email');
  const [contactValue, setContactValue] = useState('');

  useEffect(() => {
    if (contact) {
      setContactType(contact.contactType as 'email' | 'phone');
      setContactValue(contact.contactValue);
    }
  }, [contact]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!contact) return;

    if (!contactValue.trim()) {
      setError(`Please provide a ${contactType === 'email' ? 'email' : 'phone number'}`);
      return;
    }

    try {
      await updateContact.mutateAsync({
        accountId,
        contactId: contact.id,
        data: {
          contactType,
          contactValue,
          updatedBy: session?.user?.id ?? 'system',
        },
      });

      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleDialogOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setError(null);
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent className='max-w-md'>
        <DialogHeader>
          <DialogTitle className='text-xl'>Edit Contact</DialogTitle>
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
              disabled={updateContact.isPending}
            >
              Cancel
            </Button>
            <Button
              type='submit'
              className='bg-purple cursor-pointer'
              disabled={updateContact.isPending}
            >
              {updateContact.isPending ? (
                <>
                  <Loader2 className='w-4 h-4 animate-spin mr-2' />
                  Updating...
                </>
              ) : (
                'Update Contact'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
