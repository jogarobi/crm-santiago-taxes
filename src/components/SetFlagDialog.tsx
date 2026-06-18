'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Loader2 } from 'lucide-react';
import { useUpdateAccount } from '@/hooks/use-accounts';
import { useSessionUser } from '@/lib/use-session-user';

interface SetFlagDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accountId: number;
  currentFlag?: string | null;
}

export function SetFlagDialog({
  open,
  onOpenChange,
  accountId,
  currentFlag,
}: SetFlagDialogProps) {
  const updateAccount = useUpdateAccount();
  const session = useSessionUser();
  const [comment, setComment] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setComment(currentFlag ?? '');
      setError(null);
    }
  }, [open, currentFlag]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!comment.trim()) {
      setError('Please enter a flag comment');
      return;
    }

    try {
      await updateAccount.mutateAsync({
        id: accountId,
        data: { flag: comment.trim(), updatedBy: session?.user?.id ?? 'system' },
      });
      onOpenChange(false);
    } catch {
      setError('Failed to save flag');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-md'>
        <DialogHeader>
          <DialogTitle className='text-xl'>
            {currentFlag ? 'Edit Flag' : 'Flag Account'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className='flex flex-col gap-5 mt-2'>
          {error && (
            <div className='bg-red-50 border border-red-200 rounded-lg p-3'>
              <p className='text-red-800 text-sm'>{error}</p>
            </div>
          )}

          <div className='flex flex-col gap-2'>
            <Label htmlFor='flag-comment' className='text-sm font-medium text-neutral-700'>
              Comment
            </Label>
            <Textarea
              id='flag-comment'
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder='Describe why this account is flagged...'
              rows={4}
              className='resize-none'
            />
          </div>

          <div className='flex gap-3 justify-end pt-2 border-t'>
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
              className='bg-red-600 hover:bg-red-700 text-white'
              disabled={updateAccount.isPending}
            >
              {updateAccount.isPending ? (
                <><Loader2 className='w-4 h-4 animate-spin mr-2' />Saving...</>
              ) : (
                'Save Flag'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
