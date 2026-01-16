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

interface DeleteStaffDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  staffName: string;
  onConfirm: () => void;
  isDeleting: boolean;
}

export function DeleteStaffDialog({
  open,
  onOpenChange,
  staffName,
  onConfirm,
  isDeleting,
}: DeleteStaffDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Staff Member</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className='space-y-2'>
              <p>
                Are you sure you want to delete <strong>{staffName}</strong>?
              </p>
              <p className='text-yellow-700 bg-yellow-50 p-2 rounded border border-yellow-200'>
                This staff member will be removed from the organization and lose
                access to the system.
              </p>
              <p className='text-red-600 font-medium'>
                This action cannot be undone.
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              onConfirm();
            }}
            disabled={isDeleting}
            className='bg-red-600 hover:bg-red-700 focus:ring-red-600'
          >
            {isDeleting ? (
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
