'use client';

import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';
import { Loader2 } from 'lucide-react';
import { useDeleteService } from '@/hooks/use-services';
import type { Service } from '@/lib/types/service';

interface DeleteServiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service: Service | null;
  onSuccess?: () => void;
}

export function DeleteServiceDialog({
  open,
  onOpenChange,
  service,
  onSuccess,
}: DeleteServiceDialogProps) {
  const deleteService = useDeleteService();
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    if (!service) return;

    setError(null);
    try {
      await deleteService.mutateAsync(service.id);
      onOpenChange(false);
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Service</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className='space-y-2'>
              <p>
                Are you sure you want to delete <strong>{service?.name}</strong>?
              </p>
              {error && (
                <p className='text-red-600 bg-red-50 p-2 rounded border border-red-200'>
                  {error}
                </p>
              )}
              <p className='text-yellow-700 bg-yellow-50 p-2 rounded border border-yellow-200'>
                This service will be deactivated and will no longer appear in the touchpoint dialog.
              </p>
              <p className='text-neutral-600 text-sm'>
                Existing touchpoints linked to this service will remain unchanged.
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteService.isPending}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleConfirm();
            }}
            disabled={deleteService.isPending}
            className='bg-red-600 hover:bg-red-700 focus:ring-red-600'
          >
            {deleteService.isPending ? (
              <>
                <Loader2 className='w-4 h-4 animate-spin mr-2' />
                Deleting...
              </>
            ) : (
              'Delete'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
