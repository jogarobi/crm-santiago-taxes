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
import { useDeleteAccountRelationship } from '@/hooks/use-account-relationships';
import type { AccountRelationship } from '@/lib/types/account-relationship';

interface DeleteRelationshipDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accountId: number;
  relationship: AccountRelationship | null;
}

export function DeleteRelationshipDialog({
  open,
  onOpenChange,
  accountId,
  relationship,
}: DeleteRelationshipDialogProps) {
  const deleteRelationship = useDeleteAccountRelationship();

  const handleDelete = async () => {
    if (!relationship) return;

    try {
      await deleteRelationship.mutateAsync({
        accountId: relationship.ownerAccountId,
        relationshipId: relationship.id,
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Error deleting relationship:', error);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Relationship</AlertDialogTitle>
          <AlertDialogDescription className='text-neutral-600 text-[15px]'>
            Are you sure you want to delete the relationship with{' '}
            <span className='font-semibold'>
              {relationship?.relatedAccount?.firstName}{' '}
              {relationship?.relatedAccount?.lastName}
            </span>{' '}
            ({relationship?.relationship})? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteRelationship.isPending}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={deleteRelationship.isPending}
            className='bg-red-600 hover:bg-red-700'
          >
            {deleteRelationship.isPending ? (
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
