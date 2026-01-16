'use client';

import { useState, useEffect } from 'react';
import {
  useTasks,
  useCreateTask,
  useUpdateTask,
  useDeleteTask,
} from '@/hooks/use-tasks';
import { useStaff } from '@/hooks/use-staff';
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
  PlusIcon,
  Trash2,
  Pencil,
  ClockIcon,
  UserIcon,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { Task, TaskStatus } from '@/lib/types/task';

interface EditTaskData {
  task: Task;
  content: string;
  status: TaskStatus;
  assignedTo: string;
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

const TASK_COLUMNS: {
  status: TaskStatus;
  title: string;
  colorClass: string;
}[] = [
  {
    status: 'todo',
    title: 'To Do',
    colorClass: 'bg-neutral-100 text-neutral-700 border-neutral-200',
  },
  {
    status: 'in_progress',
    title: 'In Progress',
    colorClass: 'bg-blue-100 text-blue-700 border-blue-200',
  },
  {
    status: 'done',
    title: 'Done',
    colorClass: 'bg-green-100 text-green-700 border-green-200',
  },
  {
    status: 'delayed',
    title: 'Delayed',
    colorClass: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  },
  {
    status: 'abandoned',
    title: 'Abandoned',
    colorClass: 'bg-red-100 text-red-700 border-red-200',
  },
];

function TaskCard({
  task,
  onDelete,
  onEdit,
  staffMembers,
}: {
  task: Task;
  onDelete: (id: number) => void;
  onEdit: (task: Task) => void;
  staffMembers: Array<{ id: number; firstName: string; lastName: string }>;
}) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const assignedStaff = task.assignedTo
    ? staffMembers.find((s) => s.id.toString() === task.assignedTo)
    : null;

  return (
    <>
      <Card className='mb-3 hover:shadow-md transition-shadow py-5'>
        <CardHeader className='px-4 pb-2'>
          <div className='flex items-start justify-between gap-2'>
            <div className='flex-1'>
              <div className='flex items-center gap-2 mb-2'>
                <Badge
                  variant='outline'
                  className={`text-xs font-medium ${getStatusColor(
                    task.status
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
                onClick={() => onEdit(task)}
              >
                <Pencil className='h-3.5 w-3.5' />
              </Button>
              <Button
                variant='ghost'
                size='sm'
                className='h-6 w-6 p-0 text-neutral-400 hover:text-red-600'
                onClick={() => setShowDeleteConfirm(true)}
              >
                <Trash2 className='h-3.5 w-3.5' />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className='px-4 pt-0 space-y-2'>
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
            <ClockIcon className='w-4 text-neutral-500' strokeWidth={2} />
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

      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
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
              onClick={() => setShowDeleteConfirm(false)}
            >
              Cancel
            </Button>
            <Button
              variant='destructive'
              onClick={() => {
                onDelete(task.id);
                setShowDeleteConfirm(false);
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function TaskColumn({
  title,
  colorClass,
  tasks,
  onDelete,
  onEdit,
  staffMembers,
}: {
  title: string;
  colorClass: string;
  tasks: Task[];
  onDelete: (id: number) => void;
  onEdit: (task: Task) => void;
  staffMembers: Array<{ id: number; firstName: string; lastName: string }>;
}) {
  return (
    <div className='flex-1 min-w-0'>
      <div className='bg-neutral-50 rounded-lg h-full'>
        <div className='mb-4'>
          <div className='flex items-center gap-3 mb-3'>
            <Badge
              variant='outline'
              className={`text-sm font-semibold px-3 py-1 ${colorClass}`}
            >
              {title}
            </Badge>
            <span className='text-[13px] text-neutral-400'>
              {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'}
            </span>
          </div>
        </div>
        <div className='space-y-0'>
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onDelete={onDelete}
              onEdit={onEdit}
              staffMembers={staffMembers}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function TasksPage() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newTaskContent, setNewTaskContent] = useState('');
  const [newTaskAssignedTo, setNewTaskAssignedTo] = useState('');

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editTaskData, setEditTaskData] = useState<EditTaskData | null>(null);

  const { data: session } = authClient.useSession();

  useEffect(() => {
    document.title = 'Tasks | Santiago Taxes CRM';
  }, []);

  const { data: tasksResponse, isLoading, error } = useTasks();
  const { data: staffResponse, isLoading: isLoadingStaff } = useStaff({
    pageSize: 100,
  });
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();

  const tasks = tasksResponse?.tasks || [];
  const staffMembers = staffResponse?.data || [];

  const handleCreateTask = () => {
    if (!newTaskContent.trim() || !session?.user?.id) return;

    createTask.mutate(
      {
        content: newTaskContent,
        status: 'todo',
        assignedTo: newTaskAssignedTo || undefined,
        createdBy: session.user.id,
      },
      {
        onSuccess: () => {
          setNewTaskContent('');
          setNewTaskAssignedTo('');
          setCreateDialogOpen(false);
        },
      }
    );
  };

  const handleDeleteTask = (taskId: number) => {
    deleteTask.mutate(taskId);
  };

  const handleEditTask = (task: Task) => {
    setEditTaskData({
      task,
      content: task.content,
      status: task.status,
      assignedTo: task.assignedTo || 'unassigned',
    });
    setEditDialogOpen(true);
  };

  const handleUpdateTask = () => {
    if (!editTaskData || !session?.user?.id) return;

    const assignedToValue =
      editTaskData.assignedTo && editTaskData.assignedTo !== 'unassigned'
        ? editTaskData.assignedTo
        : undefined;

    updateTask.mutate(
      {
        taskId: editTaskData.task.id,
        data: {
          content: editTaskData.content,
          status: editTaskData.status,
          assignedTo: assignedToValue,
          updatedBy: session.user.id,
        },
      },
      {
        onSuccess: () => {
          setEditDialogOpen(false);
          setEditTaskData(null);
        },
      }
    );
  };

  const tasksByStatus = {
    todo: tasks.filter((t) => t.status === 'todo'),
    in_progress: tasks.filter((t) => t.status === 'in_progress'),
    done: tasks.filter((t) => t.status === 'done'),
    delayed: tasks.filter((t) => t.status === 'delayed'),
    abandoned: tasks.filter((t) => t.status === 'abandoned'),
  };

  return (
    <div className='flex flex-col gap-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-semibold'>Tasks</h1>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <PlusIcon className='h-4 w-4' />
          New Task
        </Button>
      </div>

      {isLoading && (
        <div className='flex items-center justify-center py-12'>
          <Loader2 className='w-6 h-6 animate-spin text-purple' />
          <span className='ml-3 text-[15px] text-neutral-600'>
            Loading tasks...
          </span>
        </div>
      )}

      {error && (
        <div className='bg-red-50 border border-red-200 rounded-lg p-4'>
          <p className='text-red-800'>
            Failed to load tasks. Please try again later.
          </p>
        </div>
      )}

      {!isLoading && !error && (
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6'>
          {TASK_COLUMNS.map((column) => (
            <TaskColumn
              key={column.status}
              title={column.title}
              colorClass={column.colorClass}
              tasks={tasksByStatus[column.status]}
              onDelete={handleDeleteTask}
              onEdit={handleEditTask}
              staffMembers={staffMembers}
            />
          ))}
        </div>
      )}

      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Task</DialogTitle>
            <DialogDescription>
              Add a new task to your board. Tasks will start in the &ldquo;To
              Do&rdquo; column.
            </DialogDescription>
          </DialogHeader>
          <div className='space-y-7 py-4'>
            <div className='space-y-4'>
              <Label htmlFor='content'>Task Description</Label>
              <Textarea
                id='content'
                placeholder='Enter task description...'
                value={newTaskContent}
                onChange={(e) => setNewTaskContent(e.target.value)}
                rows={3}
              />
            </div>
            <div className='space-y-4 w-full'>
              <Label htmlFor='assignedTo'>Assign To (Optional)</Label>
              <Select
                value={newTaskAssignedTo}
                onValueChange={setNewTaskAssignedTo}
              >
                <SelectTrigger id='assignedTo' className='w-full'>
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
          </div>
          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => {
                setCreateDialogOpen(false);
                setNewTaskContent('');
                setNewTaskAssignedTo('');
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateTask}
              disabled={!newTaskContent.trim() || createTask.isPending}
            >
              {createTask.isPending && (
                <Loader2 className='h-4 w-4 animate-spin' />
              )}
              Create Task
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
          </DialogHeader>
          {editTaskData && (
            <div className='space-y-7 py-4'>
              <div className='space-y-3'>
                <Label htmlFor='edit-content'>Task Description</Label>
                <Textarea
                  id='edit-content'
                  placeholder='Enter task description...'
                  value={editTaskData.content}
                  onChange={(e) =>
                    setEditTaskData({
                      ...editTaskData,
                      content: e.target.value,
                    })
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
    </div>
  );
}
