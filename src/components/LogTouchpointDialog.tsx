'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Label } from './ui/label';
import { Loader2 } from 'lucide-react';
import { useCreateTouchpoint } from '@/hooks/use-touchpoints';
import { useServices } from '@/hooks/use-services';
import type { TouchpointType } from '@/lib/types/touchpoint';

interface LogTouchpointDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accountId?: number;
  businessId?: number;
}

const TOUCHPOINT_TYPES: TouchpointType[] = [
  'Call',
  'Walk-in',
  'Appointment',
  'Email',
];

export function LogTouchpointDialog({
  open,
  onOpenChange,
  accountId,
  businessId,
}: LogTouchpointDialogProps) {
  const createTouchpoint = useCreateTouchpoint();
  const { data: servicesData } = useServices({ isActive: true });

  const [type, setType] = useState<TouchpointType | ''>('');
  const [note, setNote] = useState('');
  const [serviceId, setServiceId] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const activeServices = servicesData?.services || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!type) {
      setError('Please select a touchpoint type');
      return;
    }

    if (!note.trim()) {
      setError('Please enter a note');
      return;
    }

    try {
      await createTouchpoint.mutateAsync({
        accountId,
        businessId,
        type: type as TouchpointType,
        note: note.trim(),
        serviceId: serviceId ? parseInt(serviceId) : undefined,
        createdBy: 'system', // TODO: Replace with actual user
      });

      onOpenChange(false);
      setType('');
      setNote('');
      setServiceId('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleDialogOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setType('');
      setNote('');
      setServiceId('');
      setError(null);
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent className='max-w-xl'>
        <DialogHeader>
          <DialogTitle className='text-xl'>Log Touchpoint</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className='flex flex-col gap-6 mt-2'>
          {error && (
            <div className='bg-red-50 border border-red-200 rounded-lg p-3'>
              <p className='text-red-800 text-sm'>{error}</p>
            </div>
          )}

          <div className='flex flex-col gap-3'>
            <Label htmlFor='type'>
              Type <span className='text-red-500'>*</span>
            </Label>
            <Select
              value={type}
              onValueChange={(value) => setType(value as TouchpointType)}
            >
              <SelectTrigger className='w-full'>
                <SelectValue placeholder='Select touchpoint type' />
              </SelectTrigger>
              <SelectContent>
                {TOUCHPOINT_TYPES.map((touchpointType) => (
                  <SelectItem key={touchpointType} value={touchpointType}>
                    {touchpointType}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className='flex flex-col gap-3'>
            <Label htmlFor='note'>
              Note <span className='text-red-500'>*</span>
            </Label>
            <Textarea
              id='note'
              value={note}
              onChange={(e) => setNote(e.target.value)}
              required
              placeholder='Describe the interaction...'
              className='min-h-32'
            />
          </div>

          <div className='flex flex-col gap-3'>
            <Label htmlFor='service'>Service (Optional)</Label>
            <Select value={serviceId} onValueChange={setServiceId}>
              <SelectTrigger className='w-full'>
                <SelectValue placeholder='Select a service' />
              </SelectTrigger>
              <SelectContent>
                {activeServices.map((service) => (
                  <SelectItem key={service.id} value={service.id.toString()}>
                    {service.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className='flex gap-3 justify-end mt-2'>
            <Button
              type='button'
              variant='outline'
              onClick={() => onOpenChange(false)}
              disabled={createTouchpoint.isPending}
            >
              Cancel
            </Button>
            <Button
              type='submit'
              className='bg-purple cursor-pointer'
              disabled={createTouchpoint.isPending}
            >
              {createTouchpoint.isPending ? (
                <>
                  <Loader2 className='w-4 h-4 animate-spin mr-2' />
                  Logging...
                </>
              ) : (
                'Log Touchpoint'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
