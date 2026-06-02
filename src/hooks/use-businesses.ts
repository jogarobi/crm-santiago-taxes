import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Business, BusinessAccountLink, CreateBusinessInput, UpdateBusinessInput } from '@/lib/types/business';

// Types
export interface FetchAllBusinessesParams {
  search?: string;
  pageSize?: number;
  pageIndex?: number;
  sortBy?: 'name';
  sortDir?: 'asc' | 'desc';
  createdBy?: string;
}

export interface AllBusinessesResponse {
  data: Business[];
  meta: {
    total: number;
    pageIndex: number;
    pageSize: number;
    totalPages: number;
  };
}

// Query Keys
export const businessKeys = {
  all: ['businesses'] as const,
  lists: () => [...businessKeys.all, 'list'] as const,
  list: (accountId: number) => [...businessKeys.lists(), accountId] as const,
  allBusinesses: (params?: FetchAllBusinessesParams) =>
    [...businessKeys.all, 'all-businesses', params] as const,
  details: () => [...businessKeys.all, 'detail'] as const,
  detail: (businessId: number) => [...businessKeys.details(), businessId] as const,
  accounts: (businessId: number) => [...businessKeys.all, 'accounts', businessId] as const,
};

// API Functions
async function fetchBusinesses(accountId: number): Promise<Business[]> {
  const response = await fetch(`/api/accounts/${accountId}/businesses`);
  if (!response.ok) {
    throw new Error('Failed to fetch businesses');
  }
  return response.json();
}

async function fetchAllBusinesses(
  params?: FetchAllBusinessesParams
): Promise<AllBusinessesResponse> {
  const urlParams = new URLSearchParams();

  if (params?.search) {
    urlParams.append('search', params.search);
  }
  if (params?.pageSize !== undefined) {
    urlParams.append('pageSize', params.pageSize.toString());
  }
  if (params?.pageIndex !== undefined) {
    urlParams.append('pageIndex', params.pageIndex.toString());
  }
  if (params?.sortBy) {
    urlParams.append('sortBy', params.sortBy);
  }
  if (params?.sortDir) {
    urlParams.append('sortDir', params.sortDir);
  }
  if (params?.createdBy) {
    urlParams.append('createdBy', params.createdBy);
  }

  const response = await fetch(`/api/businesses?${urlParams.toString()}`);
  if (!response.ok) {
    throw new Error('Failed to fetch all businesses');
  }
  return response.json();
}

async function fetchBusiness(
  accountId: number,
  businessId: number
): Promise<Business> {
  const response = await fetch(
    `/api/accounts/${accountId}/businesses/${businessId}`
  );
  if (!response.ok) {
    throw new Error('Failed to fetch business');
  }
  return response.json();
}

async function createBusiness(
  accountId: number,
  data: CreateBusinessInput
): Promise<Business> {
  const response = await fetch(`/api/accounts/${accountId}/businesses`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error('Failed to create business');
  }
  return response.json();
}

async function updateBusiness(
  accountId: number,
  businessId: number,
  data: UpdateBusinessInput
): Promise<Business> {
  const response = await fetch(
    `/api/accounts/${accountId}/businesses/${businessId}`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    }
  );
  if (!response.ok) {
    throw new Error('Failed to update business');
  }
  return response.json();
}

async function deleteBusiness(
  accountId: number,
  businessId: number
): Promise<{ message: string }> {
  const response = await fetch(
    `/api/accounts/${accountId}/businesses/${businessId}`,
    {
      method: 'DELETE',
    }
  );
  if (!response.ok) {
    throw new Error('Failed to delete business');
  }
  return response.json();
}

async function fetchBusinessAccounts(businessId: number): Promise<BusinessAccountLink[]> {
  const response = await fetch(`/api/businesses/${businessId}/accounts`);
  if (!response.ok) throw new Error('Failed to fetch business accounts');
  return response.json();
}

async function addBusinessAccount(
  businessId: number,
  accountId: number,
  createdBy: string
): Promise<BusinessAccountLink> {
  const response = await fetch(`/api/businesses/${businessId}/accounts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ accountId, createdBy }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to add account to business');
  }
  return response.json();
}

async function removeBusinessAccount(
  businessId: number,
  accountId: number
): Promise<{ message: string }> {
  const response = await fetch(`/api/businesses/${businessId}/accounts/${accountId}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to remove account from business');
  }
  return response.json();
}

// Hooks
async function fetchBusinessCreators(): Promise<string[]> {
  const response = await fetch('/api/businesses/creators');
  if (!response.ok) throw new Error('Failed to fetch creators');
  const data: { creators: string[] } = await response.json();
  return data.creators;
}

export function useBusinessCreators() {
  return useQuery({
    queryKey: [...businessKeys.all, 'creators'] as const,
    queryFn: fetchBusinessCreators,
  });
}

export function useBusinesses(accountId: number) {
  return useQuery({
    queryKey: businessKeys.list(accountId),
    queryFn: () => fetchBusinesses(accountId),
    enabled: !!accountId,
  });
}

export function useAllBusinesses(params?: FetchAllBusinessesParams) {
  return useQuery({
    queryKey: businessKeys.allBusinesses(params),
    queryFn: () => fetchAllBusinesses(params),
  });
}

export function useBusiness(accountId: number, businessId: number) {
  return useQuery({
    queryKey: businessKeys.detail(businessId),
    queryFn: () => fetchBusiness(accountId, businessId),
    enabled: !!accountId && !!businessId,
  });
}

export function useCreateBusiness() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      accountId,
      data,
    }: {
      accountId: number;
      data: CreateBusinessInput;
    }) => createBusiness(accountId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: businessKeys.list(variables.accountId),
      });
    },
  });
}

export function useUpdateBusiness() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      accountId,
      businessId,
      data,
    }: {
      accountId: number;
      businessId: number;
      data: UpdateBusinessInput;
    }) => updateBusiness(accountId, businessId, data),
    onSuccess: (result, variables) => {
      queryClient.invalidateQueries({
        queryKey: businessKeys.list(variables.accountId),
      });
      queryClient.invalidateQueries({
        queryKey: businessKeys.detail(variables.businessId),
      });
    },
  });
}

export function useDeleteBusiness() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      accountId,
      businessId,
    }: {
      accountId: number;
      businessId: number;
    }) => deleteBusiness(accountId, businessId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: businessKeys.list(variables.accountId),
      });
      queryClient.invalidateQueries({
        queryKey: businessKeys.detail(variables.businessId),
      });
    },
  });
}

export function useBusinessAccounts(businessId: number) {
  return useQuery({
    queryKey: businessKeys.accounts(businessId),
    queryFn: () => fetchBusinessAccounts(businessId),
    enabled: !!businessId,
  });
}

export function useAddBusinessAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      businessId,
      accountId,
      createdBy,
    }: {
      businessId: number;
      accountId: number;
      createdBy: string;
    }) => addBusinessAccount(businessId, accountId, createdBy),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: businessKeys.accounts(variables.businessId),
      });
      queryClient.invalidateQueries({
        queryKey: businessKeys.detail(variables.businessId),
      });
    },
  });
}

export function useRemoveBusinessAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      businessId,
      accountId,
    }: {
      businessId: number;
      accountId: number;
    }) => removeBusinessAccount(businessId, accountId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: businessKeys.accounts(variables.businessId),
      });
      queryClient.invalidateQueries({
        queryKey: businessKeys.detail(variables.businessId),
      });
    },
  });
}
