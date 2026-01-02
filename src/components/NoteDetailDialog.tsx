'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Loader2, Edit2Icon, TrashIcon, XIcon, CheckIcon } from 'lucide-react';
import { useUpdateNote, useDeleteNote } from '@/hooks/use-notes';
import { Note } from '@/lib/types/note';
import { format } from 'date-fns';
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

interface NoteDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  note: Note | null;
}

export function NoteDetailDialog({
  open,
  onOpenChange,
  note,
}: NoteDetailDialogProps) {
  const updateNote = useUpdateNote();
  const deleteNote = useDeleteNote();
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleEdit = () => {
    if (note) {
      setContent(note.content || '');
      setIsEditing(true);
      setError(null);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setContent('');
    setError(null);
  };

  const handleSave = async () => {
    if (!note) return;

    setError(null);

    if (!content.trim()) {
      setError('Note content cannot be empty');
      return;
    }

    try {
      await updateNote.mutateAsync({
        noteId: note.id,
        accountId: note.accountId || undefined,
        data: {
          content: content.trim(),
          updatedBy: 'system', // TODO: Replace with actual user
        },
      });

      setIsEditing(false);
      setContent('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleDelete = async () => {
    if (!note) return;

    try {
      await deleteNote.mutateAsync({
        noteId: note.id,
        accountId: note.accountId || undefined,
      });

      setShowDeleteConfirm(false);
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleDialogOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setIsEditing(false);
      setContent('');
      setError(null);
    }
    onOpenChange(newOpen);
  };

  if (!note) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={handleDialogOpenChange}>
        <DialogContent className='max-w-2xl'>
          <DialogHeader>
            <DialogTitle className='text-xl flex items-center justify-between'>
              <span>{isEditing ? 'Edit Note' : 'Note Details'}</span>
              <div className='flex items-center gap-2 mr-5'>
                {!isEditing && (
                  <>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={handleEdit}
                      disabled={updateNote.isPending}
                    >
                      <Edit2Icon size={14} />
                    </Button>
                    <Button
                      variant='outline'
                      size='sm'
                      className='text-red-600 hover:text-red-700'
                      onClick={() => setShowDeleteConfirm(true)}
                      disabled={deleteNote.isPending}
                    >
                      <TrashIcon size={14} />
                    </Button>
                  </>
                )}
              </div>
            </DialogTitle>
          </DialogHeader>

          <div className='flex flex-col gap-6 mt-4'>
            {error && (
              <div className='bg-red-50 border border-red-200 rounded-lg p-3'>
                <p className='text-red-800 text-sm'>{error}</p>
              </div>
            )}

            {isEditing ? (
              <div className='flex flex-col gap-2'>
                <Label
                  htmlFor='content'
                  className='text-sm font-medium text-neutral-700'
                >
                  Note Content <span className='text-red-500'>*</span>
                </Label>
                <Textarea
                  id='content'
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  required
                  placeholder='Enter your note here...'
                  className='min-h-48'
                />
              </div>
            ) : (
              <div className='flex flex-col gap-4'>
                <div>
                  <p className='text-gray-800 whitespace-pre-wrap leading-relaxed text-[15px]'>
                    {note.content || '(Empty note)'}
                  </p>
                </div>

                <div className='border-t pt-6 mt-3 text-sm text-neutral-500 flex flex-col gap-2'>
                  <p>Created by: {note.createdBy}</p>
                  <p>Created on: {format(new Date(note.createdAt), 'PPP p')}</p>
                </div>
              </div>
            )}

            {isEditing && (
              <div className='flex gap-3 justify-end pt-4 border-t'>
                <Button
                  type='button'
                  variant='outline'
                  onClick={handleCancelEdit}
                  disabled={updateNote.isPending}
                >
                  <XIcon size={16} />
                  <span className='ml-1'>Cancel</span>
                </Button>
                <Button
                  type='button'
                  className='bg-purple cursor-pointer'
                  onClick={handleSave}
                  disabled={updateNote.isPending}
                >
                  {updateNote.isPending ? (
                    <>
                      <Loader2 className='w-4 h-4 animate-spin mr-2' />
                      Saving...
                    </>
                  ) : (
                    <>
                      <CheckIcon size={16} />
                      <span className='ml-1'>Save</span>
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Note</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this note? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteNote.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteNote.isPending}
              className='bg-red-600 hover:bg-red-700'
            >
              {deleteNote.isPending ? (
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
