'use client';

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
import { useDeleteBusiness } from '@/hooks/use-businesses';
import type { Business } from '@/lib/types/business';

interface DeleteBusinessDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accountId: number;
  business: Business | null;
}

export function DeleteBusinessDialog({
  open,
  onOpenChange,
  accountId,
  business,
}: DeleteBusinessDialogProps) {
  const deleteBusiness = useDeleteBusiness();

  const handleDelete = async () => {
    if (!business) return;

    try {
      await deleteBusiness.mutateAsync({
        accountId,
        businessId: business.id,
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to delete business:', error);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Business</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete{' '}
            <span className='font-semibold'>{business?.registeredName}</span>?
            This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteBusiness.isPending}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={deleteBusiness.isPending}
            className='bg-red-600 hover:bg-red-700 focus:ring-red-600'
          >
            {deleteBusiness.isPending ? (
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
