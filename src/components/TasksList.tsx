'use client';

import { useState, useEffect } from 'react';
import { useTasks, useUpdateTask, useDeleteTask } from '@/hooks/use-tasks';
import { useStaff } from '@/hooks/use-staff';
import { useAccounts } from '@/hooks/use-accounts';
import { useAllBusinesses } from '@/hooks/use-businesses';
import { authClient } from '@/app/api/clients';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Loader2,
  Trash2,
  Pencil,
  ClockIcon,
  UserIcon,
  SearchIcon,
  UserCircleIcon,
  BuildingIcon,
  Building2Icon,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { Task, TaskStatus } from '@/lib/types/task';

type LinkType = 'none' | 'client' | 'business';

interface TasksListProps {
  accountId?: number;
  businessId?: number;
  dateFrom?: string;
  dateTo?: string;
}

interface EditTaskData {
  task: Task;
  content: string;
  status: TaskStatus;
  assignedTo: string;
  linkType: LinkType;
  selectedAccountId: number | null;
  selectedAccountName: string | null;
  selectedBusinessId: number | null;
  selectedBusinessName: string | null;
}

function getStatusColor(status: TaskStatus): string {
  switch (status) {
    case 'todo':
      return 'bg-neutral-100 text-neutral-700 border-neutral-200';
    case 'in_progress':
      return 'bg-blue-100 text-blue-700 border-blue-200';
    case 'done':
      return 'bg-green-100 text-green-700 border-green-200';
    case 'delayed':
      return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    case 'abandoned':
      return 'bg-red-100 text-red-700 border-red-200';
    default:
      return 'bg-neutral-100 text-neutral-700 border-neutral-200';
  }
}

function getStatusLabel(status: TaskStatus): string {
  switch (status) {
    case 'todo':
      return 'To Do';
    case 'in_progress':
      return 'In Progress';
    case 'done':
      return 'Done';
    case 'delayed':
      return 'Delayed';
    case 'abandoned':
      return 'Abandoned';
    default:
      return status;
  }
}

export function TasksList({ accountId, businessId, dateFrom, dateTo }: TasksListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [limit, setLimit] = useState(10);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editTaskData, setEditTaskData] = useState<EditTaskData | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [linkSearchInput, setLinkSearchInput] = useState('');
  const [debouncedLinkSearch, setDebouncedLinkSearch] = useState('');

  const { data: session } = authClient.useSession();

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedLinkSearch(linkSearchInput), 400);
    return () => clearTimeout(timer);
  }, [linkSearchInput]);

  const { data: tasksResponse, isLoading } = useTasks({
    accountId,
    businessId,
    search: searchQuery || undefined,
    dateFrom,
    dateTo,
    limit,
    offset: 0,
  });

  const { data: staffResponse, isLoading: isLoadingStaff } = useStaff({
    pageSize: 100,
  });

  const { data: accountsData, isLoading: isLoadingAccounts } = useAccounts(
    editTaskData?.linkType === 'client' && !editTaskData.selectedAccountId && debouncedLinkSearch
      ? { search: debouncedLinkSearch, pageSize: 10 }
      : undefined,
  );
  const { data: businessesData, isLoading: isLoadingBusinesses } = useAllBusinesses(
    editTaskData?.linkType === 'business' && !editTaskData.selectedBusinessId && debouncedLinkSearch
      ? { search: debouncedLinkSearch, pageSize: 10 }
      : undefined,
  );

  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();

  const tasks = tasksResponse?.tasks || [];
  const staffMembers = staffResponse?.data || [];
  const searchedAccounts = accountsData?.data || [];
  const searchedBusinesses = businessesData?.data || [];
  const hasMore = tasksResponse?.hasMore || false;

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setLimit(10); // Reset limit when search changes
  };

  const handleShowMore = () => {
    setLimit((prev) => prev + 10);
  };

  const handleEditTask = (task: Task) => {
    const linkType: LinkType = task.businessId ? 'business' : task.accountId ? 'client' : 'none';
    setEditTaskData({
      task,
      content: task.content,
      status: task.status,
      assignedTo: task.assignedTo || 'unassigned',
      linkType,
      selectedAccountId: task.accountId ?? null,
      selectedAccountName: task.accountName ?? null,
      selectedBusinessId: task.businessId ?? null,
      selectedBusinessName: task.businessName ?? null,
    });
    setLinkSearchInput('');
    setDebouncedLinkSearch('');
    setEditDialogOpen(true);
  };

  const handleUpdateTask = () => {
    if (!editTaskData || !session?.user?.id) return;

    const assignedToValue =
      editTaskData.assignedTo && editTaskData.assignedTo !== 'unassigned'
        ? editTaskData.assignedTo
        : undefined;

    const accountId =
      editTaskData.linkType === 'client' ? (editTaskData.selectedAccountId ?? null) : null;
    const businessId =
      editTaskData.linkType === 'business' ? (editTaskData.selectedBusinessId ?? null) : null;

    updateTask.mutate(
      {
        taskId: editTaskData.task.id,
        data: {
          content: editTaskData.content,
          status: editTaskData.status,
          assignedTo: assignedToValue,
          accountId,
          businessId,
          updatedBy: session.user.id,
        },
      },
      {
        onSuccess: () => {
          setEditDialogOpen(false);
          setEditTaskData(null);
        },
      },
    );
  };

  const handleDeleteTask = () => {
    if (!taskToDelete) return;

    deleteTask.mutate(taskToDelete.id, {
      onSuccess: () => {
        setDeleteConfirmOpen(false);
        setTaskToDelete(null);
      },
    });
  };

  const handleDeleteClick = (task: Task) => {
    setTaskToDelete(task);
    setDeleteConfirmOpen(true);
  };

  return (
    <>
      <div className='flex items-center gap-4 mb-6'>
        <div className='relative flex-1'>
          <SearchIcon
            className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400'
            size={18}
          />
          <input
            type='text'
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder='Search tasks...'
            className='pl-10 pr-3 py-3 rounded-lg border text-sm w-full'
          />
        </div>
      </div>

      {isLoading ? (
        <div className='flex items-center justify-center py-12'>
          <Loader2 className='w-5 h-5 animate-spin text-purple' />
          <span className='ml-2 text-neutral-600 text-sm'>
            Loading tasks...
          </span>
        </div>
      ) : tasks.length === 0 ? (
        <div className='text-center py-12 text-neutral-500'>
          {searchQuery ? (
            <>
              <p>No tasks found matching &quot;{searchQuery}&quot;</p>
            </>
          ) : (
            <>
              <p>No tasks found</p>
              <p className='text-sm mt-2'>
                Click &quot;New Task&quot; to create one
              </p>
            </>
          )}
        </div>
      ) : (
        <>
          <div className='grid grid-cols-3 gap-3'>
            {tasks.map((task) => {
              const assignedStaff = task.assignedTo
                ? staffMembers.find((s) => s.id.toString() === task.assignedTo)
                : null;

              return (
                <Card
                  key={task.id}
                  className='hover:shadow-md transition-shadow py-5'
                >
                  <CardHeader className='px-4 pb-2'>
                    <div className='flex items-start justify-between gap-2'>
                      <div className='flex-1'>
                        <div className='flex items-center gap-2 mb-2'>
                          <Badge
                            variant='outline'
                            className={`text-xs font-medium ${getStatusColor(
                              task.status,
                            )}`}
                          >
                            {getStatusLabel(task.status)}
                          </Badge>
                        </div>
                        <CardTitle className='text-[16px] mt-4 font-medium text-neutral-900'>
                          {task.content}
                        </CardTitle>
                      </div>
                      <div className='flex items-center gap-1'>
                        <Button
                          variant='ghost'
                          size='sm'
                          className='h-6 w-6 p-0 text-neutral-400 hover:text-blue-600'
                          onClick={() => handleEditTask(task)}
                        >
                          <Pencil className='h-3.5 w-3.5' />
                        </Button>
                        <Button
                          variant='ghost'
                          size='sm'
                          className='h-6 w-6 p-0 text-neutral-400 hover:text-red-600'
                          onClick={() => handleDeleteClick(task)}
                        >
                          <Trash2 className='h-3.5 w-3.5' />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className='px-4 pt-0 space-y-2'>
                    {task.businessName && (
                      <div className='flex items-center gap-1'>
                        <BuildingIcon
                          className='w-4 h-4 text-neutral-500'
                          strokeWidth={2}
                        />
                        <p className='text-sm text-neutral-600 font-medium'>
                          {task.businessName}
                        </p>
                      </div>
                    )}
                    {!task.businessName && task.accountName && (
                      <div className='flex items-center gap-1'>
                        <UserCircleIcon
                          className='w-4 h-4 text-neutral-500'
                          strokeWidth={2}
                        />
                        <p className='text-sm text-neutral-600 font-medium'>
                          {task.accountName}
                        </p>
                      </div>
                    )}
                    {assignedStaff && (
                      <div className='flex items-center gap-1'>
                        <UserIcon
                          className='w-4.5 h-4.5 stroke-purple'
                          strokeWidth={2.4}
                        />
                        <p className='text-sm text-purple font-medium'>
                          Assigned to:{' '}
                          <span>
                            {assignedStaff.firstName} {assignedStaff.lastName}
                          </span>
                        </p>
                      </div>
                    )}
                    <div className='flex items-center gap-1'>
                      <ClockIcon
                        className='w-4 text-neutral-500'
                        strokeWidth={2}
                      />
                      <p className='text-sm text-neutral-500'>
                        Created on{' '}
                        {new Date(task.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {hasMore && (
            <div className='flex justify-center mt-6'>
              <Button
                variant='outline'
                onClick={handleShowMore}
                className='cursor-pointer'
              >
                Show More
              </Button>
            </div>
          )}
        </>
      )}

      {/* Edit Task Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={(open) => {
        setEditDialogOpen(open);
        if (!open) { setEditTaskData(null); setLinkSearchInput(''); }
      }}>
        <DialogContent className='max-w-xl'>
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
          </DialogHeader>
          {editTaskData && (
            <div className='space-y-5 py-4'>
              <div className='space-y-3'>
                <Label htmlFor='edit-content'>Task Description</Label>
                <Textarea
                  id='edit-content'
                  placeholder='Enter task description...'
                  value={editTaskData.content}
                  onChange={(e) =>
                    setEditTaskData({ ...editTaskData, content: e.target.value })
                  }
                  rows={3}
                />
              </div>
              <div className='space-y-3'>
                <Label htmlFor='edit-status'>Status</Label>
                <Select
                  value={editTaskData.status}
                  onValueChange={(value: TaskStatus) =>
                    setEditTaskData({ ...editTaskData, status: value })
                  }
                >
                  <SelectTrigger id='edit-status' className='w-full'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='todo'>To Do</SelectItem>
                    <SelectItem value='in_progress'>In Progress</SelectItem>
                    <SelectItem value='done'>Done</SelectItem>
                    <SelectItem value='delayed'>Delayed</SelectItem>
                    <SelectItem value='abandoned'>Abandoned</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className='space-y-3'>
                <Label>Link to (Optional)</Label>
                <Select
                  value={editTaskData.linkType}
                  onValueChange={(value: LinkType) => {
                    setEditTaskData({
                      ...editTaskData,
                      linkType: value,
                      selectedAccountId: null,
                      selectedAccountName: null,
                      selectedBusinessId: null,
                      selectedBusinessName: null,
                    });
                    setLinkSearchInput('');
                  }}
                >
                  <SelectTrigger className='w-full'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='none'>None (General Task)</SelectItem>
                    <SelectItem value='client'>Client Account</SelectItem>
                    <SelectItem value='business'>Business</SelectItem>
                  </SelectContent>
                </Select>

                {editTaskData.linkType === 'client' && editTaskData.selectedAccountId && (
                  <div className='flex items-center justify-between p-3 bg-neutral-50 border rounded-lg'>
                    <div className='flex items-center gap-2'>
                      <UserCircleIcon className='w-5 h-5 text-neutral-500' />
                      <span className='text-sm font-medium text-neutral-900'>
                        {editTaskData.selectedAccountName}
                      </span>
                    </div>
                    <Button
                      type='button'
                      variant='ghost'
                      size='sm'
                      className='h-7 text-neutral-500'
                      onClick={() => {
                        setEditTaskData({ ...editTaskData, selectedAccountId: null, selectedAccountName: null });
                        setLinkSearchInput('');
                      }}
                    >
                      Change
                    </Button>
                  </div>
                )}

                {editTaskData.linkType === 'client' && !editTaskData.selectedAccountId && (
                  <div className='space-y-2'>
                    <div className='relative'>
                      <SearchIcon className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400' />
                      <Input
                        placeholder='Search client by name...'
                        value={linkSearchInput}
                        onChange={(e) => setLinkSearchInput(e.target.value)}
                        className='pl-9'
                      />
                    </div>
                    <div className='flex flex-col gap-1 max-h-40 overflow-y-auto border rounded-lg'>
                      {isLoadingAccounts ? (
                        <div className='flex items-center justify-center py-6'>
                          <Loader2 className='w-4 h-4 animate-spin text-neutral-400' />
                        </div>
                      ) : searchedAccounts.length === 0 ? (
                        <p className='text-center py-6 text-sm text-neutral-400'>
                          {linkSearchInput ? 'No clients found' : 'Start typing to search'}
                        </p>
                      ) : (
                        searchedAccounts.map((account) => (
                          <div
                            key={account.id}
                            className='flex items-center gap-3 px-3 py-2 hover:bg-neutral-50 cursor-pointer'
                            onClick={() => {
                              setEditTaskData({
                                ...editTaskData,
                                selectedAccountId: account.id,
                                selectedAccountName: `${account.firstName} ${account.lastName}`,
                              });
                              setLinkSearchInput('');
                            }}
                          >
                            <div className='w-7 h-7 rounded-full bg-purple/10 flex items-center justify-center text-purple text-xs font-semibold'>
                              {account.firstName[0]}{account.lastName[0]}
                            </div>
                            <span className='text-sm font-medium text-neutral-900'>
                              {account.firstName} {account.lastName}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {editTaskData.linkType === 'business' && editTaskData.selectedBusinessId && (
                  <div className='flex items-center justify-between p-3 bg-neutral-50 border rounded-lg'>
                    <div className='flex items-center gap-2'>
                      <Building2Icon className='w-5 h-5 text-neutral-500' />
                      <span className='text-sm font-medium text-neutral-900'>
                        {editTaskData.selectedBusinessName}
                      </span>
                    </div>
                    <Button
                      type='button'
                      variant='ghost'
                      size='sm'
                      className='h-7 text-neutral-500'
                      onClick={() => {
                        setEditTaskData({ ...editTaskData, selectedBusinessId: null, selectedBusinessName: null });
                        setLinkSearchInput('');
                      }}
                    >
                      Change
                    </Button>
                  </div>
                )}

                {editTaskData.linkType === 'business' && !editTaskData.selectedBusinessId && (
                  <div className='space-y-2'>
                    <div className='relative'>
                      <SearchIcon className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400' />
                      <Input
                        placeholder='Search business by name...'
                        value={linkSearchInput}
                        onChange={(e) => setLinkSearchInput(e.target.value)}
                        className='pl-9'
                      />
                    </div>
                    <div className='flex flex-col gap-1 max-h-40 overflow-y-auto border rounded-lg'>
                      {isLoadingBusinesses ? (
                        <div className='flex items-center justify-center py-6'>
                          <Loader2 className='w-4 h-4 animate-spin text-neutral-400' />
                        </div>
                      ) : searchedBusinesses.length === 0 ? (
                        <p className='text-center py-6 text-sm text-neutral-400'>
                          {linkSearchInput ? 'No businesses found' : 'Start typing to search'}
                        </p>
                      ) : (
                        searchedBusinesses.map((biz) => (
                          <div
                            key={biz.id}
                            className='flex items-center gap-3 px-3 py-2 hover:bg-neutral-50 cursor-pointer'
                            onClick={() => {
                              setEditTaskData({
                                ...editTaskData,
                                selectedBusinessId: biz.id,
                                selectedBusinessName: biz.registeredName,
                              });
                              setLinkSearchInput('');
                            }}
                          >
                            <div className='w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-blue-700'>
                              <Building2Icon size={14} />
                            </div>
                            <span className='text-sm font-medium text-neutral-900'>
                              {biz.registeredName}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
              <div className='space-y-3'>
                <Label htmlFor='edit-assignedTo'>Assign To (Optional)</Label>
                <Select
                  value={editTaskData.assignedTo}
                  onValueChange={(value) =>
                    setEditTaskData({ ...editTaskData, assignedTo: value })
                  }
                >
                  <SelectTrigger id='edit-assignedTo' className='w-full'>
                    <SelectValue placeholder='Select a staff member...' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='unassigned'>Unassigned</SelectItem>
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
            </div>
          )}
          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => {
                setEditDialogOpen(false);
                setEditTaskData(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateTask}
              disabled={!editTaskData?.content.trim() || updateTask.isPending}
            >
              {updateTask.isPending && (
                <Loader2 className='h-4 w-4 animate-spin' />
              )}
              Update Task
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Task</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this task? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => {
                setDeleteConfirmOpen(false);
                setTaskToDelete(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant='destructive'
              onClick={handleDeleteTask}
              disabled={deleteTask.isPending}
            >
              {deleteTask.isPending && (
                <Loader2 className='h-4 w-4 animate-spin' />
              )}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
