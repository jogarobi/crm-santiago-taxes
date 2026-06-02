import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export interface Staff {
  id: number;
  userId?: string | null;
  squareId: string | null;
  title: string;
  status: string;
  firstName: string;
  lastName: string;
  email?: string | null;
  role?: string | null;
  createdAt: string;
  createdBy: string;
  updatedAt: string | null;
  updatedBy: string | null;
}

export interface CreateStaffInput {
  firstName: string;
  lastName: string;
  title: string;
  status: string;
  email?: string;
  squareId?: string;
  createdBy: string;
  createAccount?: boolean;
  password?: string;
  role?: string;
}

export interface UpdateStaffInput {
  firstName?: string;
  lastName?: string;
  title?: string;
  role?: string;
  status?: string;
  email?: string;
  squareId?: string;
  updatedBy: string;
}

export interface StaffResponse {
  data: Staff[];
  meta: {
    total: number;
    pageIndex: number;
    pageSize: number;
    totalPages: number;
  };
}

export interface UseStaffParams {
  search?: string;
  pageIndex?: number;
  pageSize?: number;
}

export const staffKeys = {
  all: ['staff'] as const,
  lists: () => [...staffKeys.all, 'list'] as const,
  list: (params?: UseStaffParams) => [...staffKeys.lists(), params] as const,
};

async function fetchStaff(params?: UseStaffParams): Promise<StaffResponse> {
  const queryParams = new URLSearchParams();

  if (params?.search) {
    queryParams.append('search', params.search);
  }
  if (params?.pageIndex !== undefined) {
    queryParams.append('pageIndex', params.pageIndex.toString());
  }
  if (params?.pageSize !== undefined) {
    queryParams.append('pageSize', params.pageSize.toString());
  }

  const response = await fetch(`/api/staff?${queryParams.toString()}`);

  if (!response.ok) {
    throw new Error('Failed to fetch staff');
  }

  return response.json();
}

async function createStaff(data: CreateStaffInput): Promise<Staff> {
  const response = await fetch('/api/staff', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error('Failed to create staff member');
  }

  return response.json();
}

async function updateStaff(id: number, data: UpdateStaffInput): Promise<Staff> {
  const response = await fetch(`/api/staff/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error('Failed to update staff member');
  }

  return response.json();
}

async function deleteStaff(id: number): Promise<void> {
  const response = await fetch(`/api/staff/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to delete staff member');
  }

  return response.json();
}

async function fetchCurrentStaff(): Promise<Staff | null> {
  const response = await fetch('/api/staff/me');
  if (response.status === 404) return null;
  if (!response.ok) throw new Error('Failed to fetch current staff');
  return response.json();
}

export function useCurrentStaff() {
  return useQuery({
    queryKey: [...staffKeys.all, 'me'] as const,
    queryFn: fetchCurrentStaff,
  });
}

export function useStaff(params?: UseStaffParams) {
  return useQuery({
    queryKey: staffKeys.list(params),
    queryFn: () => fetchStaff(params),
  });
}

export function useCreateStaff() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createStaff,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: staffKeys.lists() });
    },
  });
}

export function useUpdateStaff() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateStaffInput }) =>
      updateStaff(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: staffKeys.lists() });
    },
  });
}

export function useDeleteStaff() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteStaff,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: staffKeys.lists() });
    },
  });
}
