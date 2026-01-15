'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Loader2 } from 'lucide-react';
import { useCreateTask } from '@/hooks/use-tasks';
import { useStaff } from '@/hooks/use-staff';
import { authClient } from '@/app/api/clients';
import { useRouter } from 'next/navigation';

interface CreateTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateTaskDialog({ open, onOpenChange }: CreateTaskDialogProps) {
  const createTask = useCreateTask();
  const { data: session } = authClient.useSession();
  const { data: staffResponse, isLoading: isLoadingStaff } = useStaff({ pageSize: 100 });
  const router = useRouter();
  const [content, setContent] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [error, setError] = useState<string | null>(null);

  const staffMembers = staffResponse?.data || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!content.trim()) {
      setError('Please enter task description');
      return;
    }

    if (!session?.user?.id) {
      setError('You must be logged in to create a task');
      return;
    }

    try {
      await createTask.mutateAsync({
        content: content.trim(),
        status: 'todo',
        assignedTo: assignedTo.trim() || undefined,
        createdBy: session.user.id,
      });

      onOpenChange(false);
      setContent('');
      setAssignedTo('');
      router.push('/tasks');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleDialogOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setContent('');
      setAssignedTo('');
      setError(null);
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent className='max-w-xl'>
        <DialogHeader>
          <DialogTitle className='text-xl'>Create New Task</DialogTitle>
        </DialogHeader>

        <div className='flex flex-col gap-4 mt-2'>
          {error && (
            <div className='bg-red-50 border border-red-200 rounded-lg p-3'>
              <p className='text-red-800 text-sm'>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className='flex flex-col gap-4'>
            <div className='flex flex-col gap-2'>
              <Label htmlFor='content'>Task Description</Label>
              <Textarea
                id='content'
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
                placeholder='Enter task description...'
                className='min-h-32'
                autoFocus
              />
            </div>

            <div className='flex flex-col gap-2'>
              <Label htmlFor='assignedTo'>Assign To (Optional)</Label>
              <Select
                value={assignedTo}
                onValueChange={setAssignedTo}
              >
                <SelectTrigger id='assignedTo'>
                  <SelectValue placeholder='Select a staff member...' />
                </SelectTrigger>
                <SelectContent>
                  {isLoadingStaff ? (
                    <div className='flex items-center justify-center py-4'>
                      <Loader2 className='h-4 w-4 animate-spin text-neutral-400' />
                    </div>
                  ) : staffMembers.length === 0 ? (
                    <div className='text-center py-4 text-sm text-neutral-500'>
                      No staff members found
                    </div>
                  ) : (
                    staffMembers.map((staff) => (
                      <SelectItem key={staff.id} value={staff.id.toString()}>
                        {staff.firstName} {staff.lastName}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className='flex gap-3 justify-end mt-2'>
              <Button
                type='button'
                variant='outline'
                onClick={() => onOpenChange(false)}
                disabled={createTask.isPending}
              >
                Cancel
              </Button>
              <Button
                type='submit'
                className='bg-purple cursor-pointer'
                disabled={createTask.isPending}
              >
                {createTask.isPending ? (
                  <>
                    <Loader2 className='w-4 h-4 animate-spin mr-2' />
                    Creating...
                  </>
                ) : (
                  'Create Task'
                )}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
