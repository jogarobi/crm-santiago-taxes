'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Checkbox } from './ui/checkbox';
import { Loader2 } from 'lucide-react';
import { useUpdateService } from '@/hooks/use-services';
import type { Service } from '@/lib/types/service';

interface EditServiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service: Service | null;
  onSuccess?: () => void;
}

export function EditServiceDialog({
  open,
  onOpenChange,
  service,
  onSuccess,
}: EditServiceDialogProps) {
  const updateService = useUpdateService();
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    isActive: true,
  });

  useEffect(() => {
    if (service) {
      setFormData({
        name: service.name,
        isActive: service.isActive,
      });
    }
  }, [service]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!service) {
      setError('No service selected');
      return;
    }

    if (!formData.name || !formData.name.trim()) {
      setError('Please enter a service name');
      return;
    }

    try {
      await updateService.mutateAsync({
        serviceId: service.id,
        data: {
          name: formData.name.trim(),
          isActive: formData.isActive,
          updatedBy: 'system', // TODO: Replace with actual user
        },
      });

      onOpenChange(false);
      onSuccess?.();
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
          <DialogTitle className='text-xl'>Edit Service</DialogTitle>
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
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              required
              placeholder='e.g., Tax Preparation'
            />
          </div>

          <div className='flex items-center gap-2'>
            <Checkbox
              id='isActive'
              checked={formData.isActive}
              onCheckedChange={(checked) =>
                setFormData((prev) => ({ ...prev, isActive: checked === true }))
              }
            />
            <Label
              htmlFor='isActive'
              className='text-sm font-medium text-neutral-700 cursor-pointer'
            >
              Active
            </Label>
          </div>

          <div className='flex gap-3 justify-end mt-2 pt-4 border-t'>
            <Button
              type='button'
              variant='outline'
              onClick={() => onOpenChange(false)}
              disabled={updateService.isPending}
            >
              Cancel
            </Button>
            <Button
              type='submit'
              className='bg-purple cursor-pointer'
              disabled={updateService.isPending}
            >
              {updateService.isPending ? (
                <>
                  <Loader2 className='w-4 h-4 animate-spin mr-2' />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
