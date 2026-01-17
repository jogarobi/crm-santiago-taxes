'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Loader2 } from 'lucide-react';
import { useCreateService } from '@/hooks/use-services';

interface CreateServiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function CreateServiceDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreateServiceDialogProps) {
  const createService = useCreateService();
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.name || !formData.name.trim()) {
      setError('Please enter a service name');
      return;
    }

    try {
      await createService.mutateAsync({
        name: formData.name.trim(),
        createdBy: 'system', // TODO: Replace with actual user
      });

      onOpenChange(false);
      setFormData({ name: '' });
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleDialogOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setFormData({ name: '' });
      setError(null);
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent className='max-w-md'>
        <DialogHeader>
          <DialogTitle className='text-xl'>Create New Service</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className='flex flex-col gap-4 mt-4'>
          {error && (
            <div className='bg-red-50 border border-red-200 rounded-lg p-3'>
              <p className='text-red-800 text-sm'>{error}</p>
            </div>
          )}

          <div className='flex flex-col gap-2'>
            <Label
              htmlFor='name'
              className='text-sm font-medium text-neutral-700'
            >
              Service Name <span className='text-red-500'>*</span>
            </Label>
            <Input
              id='name'
              value={formData.name}
              className='p-2'
              onChange={(e) => setFormData({ name: e.target.value })}
              required
              placeholder='e.g., Tax Preparation'
            />
          </div>

          <div className='flex gap-3 justify-end mt-2 pt-4 border-t'>
            <Button
              type='button'
              variant='outline'
              onClick={() => onOpenChange(false)}
              disabled={createService.isPending}
            >
              Cancel
            </Button>
            <Button
              type='submit'
              className='bg-purple cursor-pointer'
              disabled={createService.isPending}
            >
              {createService.isPending ? (
                <>
                  <Loader2 className='w-4 h-4 animate-spin mr-2' />
                  Creating...
                </>
              ) : (
                'Create Service'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
