import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Task, CreateTaskInput, UpdateTaskInput, TaskStatus } from '@/lib/types/task';

// Query Keys
export const taskKeys = {
  all: ['tasks'] as const,
  lists: () => [...taskKeys.all, 'list'] as const,
  list: (params?: FetchTasksParams) =>
    [...taskKeys.lists(), params] as const,
  details: () => [...taskKeys.all, 'detail'] as const,
  detail: (taskId: number) => [...taskKeys.details(), taskId] as const,
};

// Types
export interface FetchTasksParams {
  accountId?: number;
  businessId?: number;
  status?: TaskStatus;
  assignedTo?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
  offset?: number;
}

export interface TasksResponse {
  success: boolean;
  tasks: Task[];
  count: number;
  total: number;
  hasMore: boolean;
}

export interface TaskResponse {
  success: boolean;
  task: Task;
}

// API Functions
async function fetchTasks(
  params?: FetchTasksParams
): Promise<TasksResponse> {
  const urlParams = new URLSearchParams();

  if (params?.accountId !== undefined) {
    urlParams.append('accountId', params.accountId.toString());
  }
  if (params?.businessId !== undefined) {
    urlParams.append('businessId', params.businessId.toString());
  }
  if (params?.status) {
    urlParams.append('status', params.status);
  }
  if (params?.assignedTo) {
    urlParams.append('assignedTo', params.assignedTo);
  }
  if (params?.search) {
    urlParams.append('search', params.search);
  }
  if (params?.dateFrom) {
    urlParams.append('dateFrom', params.dateFrom);
  }
  if (params?.dateTo) {
    urlParams.append('dateTo', params.dateTo);
  }
  if (params?.limit !== undefined) {
    urlParams.append('limit', params.limit.toString());
  }
  if (params?.offset !== undefined) {
    urlParams.append('offset', params.offset.toString());
  }

  const response = await fetch(`/api/tasks?${urlParams.toString()}`);
  if (!response.ok) {
    throw new Error('Failed to fetch tasks');
  }
  return response.json();
}

async function fetchTask(taskId: number): Promise<TaskResponse> {
  const response = await fetch(`/api/tasks/${taskId}`);
  if (!response.ok) {
    throw new Error('Failed to fetch task');
  }
  return response.json();
}

async function createTask(data: CreateTaskInput): Promise<TaskResponse> {
  const response = await fetch('/api/tasks', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error('Failed to create task');
  }
  return response.json();
}

async function updateTask(
  taskId: number,
  data: UpdateTaskInput
): Promise<TaskResponse> {
  const response = await fetch(`/api/tasks/${taskId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error('Failed to update task');
  }
  return response.json();
}

async function deleteTask(taskId: number): Promise<{ success: boolean; message: string }> {
  const response = await fetch(`/api/tasks/${taskId}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error('Failed to delete task');
  }
  return response.json();
}

// Hooks
export function useTasks(params?: FetchTasksParams) {
  return useQuery({
    queryKey: taskKeys.list(params),
    queryFn: () => fetchTasks(params),
  });
}

export function useTask(taskId: number) {
  return useQuery({
    queryKey: taskKeys.detail(taskId),
    queryFn: () => fetchTask(taskId),
    enabled: !!taskId,
  });
}

export function useCreateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateTaskInput) => createTask(data),
    onSuccess: () => {
      // Invalidate all task list queries
      queryClient.invalidateQueries({
        predicate: (query) =>
          query.queryKey[0] === 'tasks' &&
          query.queryKey[1] === 'list',
      });
    },
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskId, data }: { taskId: number; data: UpdateTaskInput }) =>
      updateTask(taskId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: taskKeys.detail(variables.taskId) });
      // Invalidate all list queries to refresh the board
      queryClient.invalidateQueries({
        predicate: (query) =>
          query.queryKey[0] === 'tasks' &&
          query.queryKey[1] === 'list',
      });
    },
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (taskId: number) => deleteTask(taskId),
    onSuccess: (_, taskId) => {
      queryClient.invalidateQueries({ queryKey: taskKeys.detail(taskId) });
      // Invalidate all list queries
      queryClient.invalidateQueries({
        predicate: (query) =>
          query.queryKey[0] === 'tasks' &&
          query.queryKey[1] === 'list',
      });
    },
  });
}
