'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
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

interface ContactRowProps {
  contact: AccountContact;
  display: string;
  onEdit: () => void;
  onDelete: () => void;
}

function ContactRow({ display, onEdit, onDelete }: ContactRowProps) {
  return (
    <div className='flex items-center justify-between py-2 px-3 rounded-lg hover:bg-neutral-50 group'>
      <span className='text-[15px]'>{display}</span>
      <div className='flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity'>
        <Button
          variant='ghost'
          size='sm'
          onClick={onEdit}
          className='h-7 w-7 p-0 text-neutral-500 hover:text-neutral-900'
        >
          <Edit2Icon size={13} />
          <span className='sr-only'>Edit</span>
        </Button>
        <Button
          variant='ghost'
          size='sm'
          onClick={onDelete}
          className='h-7 w-7 p-0 text-neutral-500 hover:text-red-600'
        >
          <TrashIcon size={13} />
          <span className='sr-only'>Delete</span>
        </Button>
      </div>
    </div>
  );
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

  const phones = contacts?.filter((c) => c.contactType.toLowerCase().includes('phone')) ?? [];
  const emails = contacts?.filter((c) => c.contactType.toLowerCase().includes('email')) ?? [];

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
      await deleteContact.mutateAsync({ accountId, contactId: selectedContact.id });
      setDeleteContactDialogOpen(false);
      setSelectedContact(null);
    } catch (error) {
      console.error('Failed to delete contact:', error);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className='max-w-lg'>
          <DialogHeader>
            <div className='flex items-center justify-between'>
              <DialogTitle className='text-xl'>Manage Contacts</DialogTitle>
              <Button
                className='bg-purple cursor-pointer mr-6'
                size='sm'
                onClick={() => setAddContactDialogOpen(true)}
              >
                <PlusIcon className='w-4 h-4' />
                Add Contact
              </Button>
            </div>
          </DialogHeader>

          {isLoading ? (
            <div className='flex items-center justify-center py-12'>
              <Loader2 className='w-6 h-6 animate-spin text-purple' />
              <span className='ml-3 text-[15px] text-neutral-600'>Loading contacts...</span>
            </div>
          ) : (
            <div className='flex flex-col gap-5 mt-2'>
              <div>
                <div className='flex items-center gap-2 mb-2'>
                  <PhoneIcon size={14} className='text-neutral-500' />
                  <span className='text-sm font-medium text-neutral-600'>Phone Numbers</span>
                </div>
                {phones.length === 0 ? (
                  <p className='text-sm text-neutral-400 px-3 py-2'>No phone numbers added</p>
                ) : (
                  <div className='flex flex-col'>
                    {phones.map((contact) => (
                      <ContactRow
                        key={contact.id}
                        contact={contact}
                        display={formatPhoneNumber(contact.contactValue)}
                        onEdit={() => handleEditClick(contact)}
                        onDelete={() => handleDeleteClick(contact)}
                      />
                    ))}
                  </div>
                )}
              </div>

              <div className='border-t pt-4'>
                <div className='flex items-center gap-2 mb-2'>
                  <MailIcon size={14} className='text-neutral-500' />
                  <span className='text-sm font-medium text-neutral-600'>Email Addresses</span>
                </div>
                {emails.length === 0 ? (
                  <p className='text-sm text-neutral-400 px-3 py-2'>No email addresses added</p>
                ) : (
                  <div className='flex flex-col'>
                    {emails.map((contact) => (
                      <ContactRow
                        key={contact.id}
                        contact={contact}
                        display={contact.contactValue}
                        onEdit={() => handleEditClick(contact)}
                        onDelete={() => handleDeleteClick(contact)}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
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

      <AlertDialog open={deleteContactDialogOpen} onOpenChange={setDeleteContactDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Contact</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this contact? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteContact.isPending}>Cancel</AlertDialogCancel>
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
