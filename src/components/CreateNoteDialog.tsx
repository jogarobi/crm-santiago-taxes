'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Loader2 } from 'lucide-react';
import { useCreateNote } from '@/lib/hooks/use-notes';

interface CreateNoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accountId: number;
}

export function CreateNoteDialog({
  open,
  onOpenChange,
  accountId,
}: CreateNoteDialogProps) {
  const createNote = useCreateNote();
  const [content, setContent] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!content.trim()) {
      setError('Please enter note content');
      return;
    }

    try {
      await createNote.mutateAsync({
        accountId,
        data: {
          content: content.trim(),
          createdBy: 'system', // TODO: Replace with actual user
        },
      });

      onOpenChange(false);
      setContent('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleDialogOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setContent('');
      setError(null);
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent className='max-w-xl'>
        <DialogHeader>
          <DialogTitle className='text-xl'>Create New Note</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className='flex flex-col gap-2 mt-4'>
          {error && (
            <div className='bg-red-50 border border-red-200 rounded-lg p-3'>
              <p className='text-red-800 text-sm'>{error}</p>
            </div>
          )}

          <div className='flex flex-col gap-2'>
            <Textarea
              id='content'
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
              placeholder='Enter your note here...'
              className='min-h-32'
            />
          </div>

          <div className='flex gap-3 justify-end mt-4'>
            <Button
              type='button'
              variant='outline'
              onClick={() => onOpenChange(false)}
              disabled={createNote.isPending}
            >
              Cancel
            </Button>
            <Button
              type='submit'
              className='bg-purple cursor-pointer'
              disabled={createNote.isPending}
            >
              {createNote.isPending ? (
                <>
                  <Loader2 className='w-4 h-4 animate-spin mr-2' />
                  Creating...
                </>
              ) : (
                'Create Note'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
