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
import { useDeleteAccount } from '@/hooks/use-accounts';
import type { Account } from '@/lib/types/account';
import { useRouter } from 'next/navigation';

interface DeleteClientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  account: Account | null;
}

export function DeleteClientDialog({
  open,
  onOpenChange,
  account,
}: DeleteClientDialogProps) {
  const deleteAccount = useDeleteAccount();
  const router = useRouter();

  const handleDelete = async () => {
    if (!account) return;

    try {
      await deleteAccount.mutateAsync(account.id);
      onOpenChange(false);
      router.push('/clients');
    } catch (error) {
      console.error('Failed to delete client:', error);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Client</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete{' '}
            <span className='font-semibold'>
              {account?.firstName} {account?.lastName}
            </span>
            ? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteAccount.isPending}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={deleteAccount.isPending}
            className='bg-red-600 hover:bg-red-700 focus:ring-red-600'
          >
            {deleteAccount.isPending ? (
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
