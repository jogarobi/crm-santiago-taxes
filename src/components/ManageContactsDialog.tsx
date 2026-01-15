'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';
import {
  Loader2,
  PlusIcon,
  Edit2Icon,
  TrashIcon,
  MailIcon,
  PhoneIcon,
} from 'lucide-react';
import { useAccountContacts, useDeleteAccountContact } from '@/hooks/use-account-contact';
import type { AccountContact } from '@/lib/types/account-contact';
import { AddContactDialog } from './AddContactDialog';
import { EditContactDialog } from './EditContactDialog';
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

interface ManageContactsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accountId: number;
}

function formatPhoneNumber(phoneNumber: string): string {
  const cleaned = phoneNumber.replace(/\D/g, '');

  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  } else if (cleaned.length === 11 && cleaned[0] === '1') {
    return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  }

  return phoneNumber;
}

export function ManageContactsDialog({
  open,
  onOpenChange,
  accountId,
}: ManageContactsDialogProps) {
  const { data: contacts, isLoading } = useAccountContacts(accountId);
  const deleteContact = useDeleteAccountContact();
  const [addContactDialogOpen, setAddContactDialogOpen] = useState(false);
  const [editContactDialogOpen, setEditContactDialogOpen] = useState(false);
  const [deleteContactDialogOpen, setDeleteContactDialogOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<AccountContact | null>(null);

  const handleDeleteClick = (contact: AccountContact) => {
    setSelectedContact(contact);
    setDeleteContactDialogOpen(true);
  };

  const handleEditClick = (contact: AccountContact) => {
    setSelectedContact(contact);
    setEditContactDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedContact) return;

    try {
      await deleteContact.mutateAsync({
        accountId,
        contactId: selectedContact.id,
      });
      setDeleteContactDialogOpen(false);
      setSelectedContact(null);
    } catch (error) {
      console.error('Failed to delete contact:', error);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className='max-w-3xl max-h-[90vh] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle className='text-xl'>Manage Contacts</DialogTitle>
          </DialogHeader>

          <div className='flex flex-col gap-4 mt-4'>
            <div className='flex justify-between items-center'>
              <p className='text-sm text-neutral-600'>
                {contacts?.length || 0} contact{contacts?.length !== 1 ? 's' : ''}
              </p>
              <Button
                className='bg-purple cursor-pointer'
                onClick={() => setAddContactDialogOpen(true)}
              >
                <PlusIcon className='w-4 h-4 mr-2' />
                Add Contact
              </Button>
            </div>

            {isLoading ? (
              <div className='flex items-center justify-center py-12'>
                <Loader2 className='w-6 h-6 animate-spin text-purple' />
                <span className='ml-3 text-[15px] text-neutral-600'>
                  Loading contacts...
                </span>
              </div>
            ) : contacts && contacts.length > 0 ? (
              <div className='border rounded-lg overflow-hidden'>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className='p-4'>Email</TableHead>
                      <TableHead className='p-4'>Phone Number</TableHead>
                      <TableHead className='p-4'>Created</TableHead>
                      <TableHead className='p-4 w-32'>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {contacts.map((contact) => (
                      <TableRow key={contact.id}>
                        <TableCell className='p-4'>
                          {contact.email ? (
                            <div className='flex items-center gap-2'>
                              <MailIcon size={16} className='text-neutral-400' />
                              <span>{contact.email}</span>
                            </div>
                          ) : (
                            <span className='text-neutral-400'>—</span>
                          )}
                        </TableCell>
                        <TableCell className='p-4'>
                          {contact.phoneNumber ? (
                            <div className='flex items-center gap-2'>
                              <PhoneIcon size={16} className='text-neutral-400' />
                              <span>{formatPhoneNumber(contact.phoneNumber)}</span>
                            </div>
                          ) : (
                            <span className='text-neutral-400'>—</span>
                          )}
                        </TableCell>
                        <TableCell className='p-4'>
                          {new Date(contact.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </TableCell>
                        <TableCell className='p-4'>
                          <div className='flex items-center gap-2'>
                            <Button
                              variant='outline'
                              size='sm'
                              onClick={() => handleEditClick(contact)}
                              className='h-8 w-8 p-0'
                            >
                              <Edit2Icon size={14} />
                              <span className='sr-only'>Edit</span>
                            </Button>
                            <Button
                              variant='outline'
                              size='sm'
                              onClick={() => handleDeleteClick(contact)}
                              className='h-8 w-8 p-0 text-red-600 hover:text-red-700'
                            >
                              <TrashIcon size={14} />
                              <span className='sr-only'>Delete</span>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className='bg-neutral-50 border rounded-lg p-12 text-center'>
                <p className='text-neutral-500 mb-2'>No contacts yet</p>
                <p className='text-sm text-neutral-400'>
                  Click &quot;Add Contact&quot; to create a new contact
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <AddContactDialog
        open={addContactDialogOpen}
        onOpenChange={setAddContactDialogOpen}
        accountId={accountId}
      />

      <EditContactDialog
        open={editContactDialogOpen}
        onOpenChange={setEditContactDialogOpen}
        accountId={accountId}
        contact={selectedContact}
      />

      <AlertDialog
        open={deleteContactDialogOpen}
        onOpenChange={setDeleteContactDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Contact</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this contact? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteContact.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleteContact.isPending}
              className='bg-red-600 hover:bg-red-700 focus:ring-red-600'
            >
              {deleteContact.isPending ? (
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
    </>
  );
}
