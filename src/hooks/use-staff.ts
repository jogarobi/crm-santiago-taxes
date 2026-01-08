import { useQuery } from '@tanstack/react-query';

export interface Staff {
  id: number;
  squareId: string | null;
  title: string;
  status: string;
  firstName: string;
  lastName: string;
  createdAt: string;
  createdBy: string;
  updatedAt: string | null;
  updatedBy: string | null;
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

export function useStaff(params?: UseStaffParams) {
  return useQuery({
    queryKey: staffKeys.list(params),
    queryFn: () => fetchStaff(params),
  });
}
