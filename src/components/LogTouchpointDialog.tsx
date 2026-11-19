'use client';

import { useMemo, useState } from 'react';
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
import { useServices, useClientServices } from '@/hooks/use-services';
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
  const NONE = 'none';
  const createTouchpoint = useCreateTouchpoint();
  const { data: servicesData } = useServices({ isActive: true });
  const { data: clientServicesData } = useClientServices(accountId ?? 0);

  const [type, setType] = useState<TouchpointType | ''>('');
  const [note, setNote] = useState('');
  const [serviceId, setServiceId] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  // Prefer the client's provided services (most recent first). Fall back to all
  // active services when there is no client context (e.g. a business touchpoint).
  // TODO (Pieza 1): switch the source to the client's open cases and preselect
  // the open case when there is exactly one.
  const serviceOptions = useMemo(() => {
    if (accountId && clientServicesData && clientServicesData.length > 0) {
      return [...clientServicesData]
        .sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''))
        .map((e) => ({ id: e.serviceId, name: e.service.name }));
    }
    return (servicesData?.services ?? []).map((s) => ({ id: s.id, name: s.name }));
  }, [accountId, clientServicesData, servicesData]);

  // Effective selection: until the user picks something (serviceId === ''),
  // default to the most recent service, or "Ninguno" when there are none.
  const effectiveServiceId =
    serviceId !== ''
      ? serviceId
      : serviceOptions[0]
        ? String(serviceOptions[0].id)
        : NONE;

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
        serviceId:
          effectiveServiceId !== NONE ? parseInt(effectiveServiceId) : undefined,
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
            <Label htmlFor='service'>Servicio (Opcional)</Label>
            <Select value={effectiveServiceId} onValueChange={setServiceId}>
              <SelectTrigger className='w-full'>
                <SelectValue placeholder='Seleccionar servicio' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>Ninguno</SelectItem>
                {serviceOptions.map((service) => (
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
