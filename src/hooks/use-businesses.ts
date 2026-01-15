import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Business, CreateBusinessInput, UpdateBusinessInput } from '@/lib/types/business';

// Query Keys
export const businessKeys = {
  all: ['businesses'] as const,
  lists: () => [...businessKeys.all, 'list'] as const,
  list: (accountId: number) => [...businessKeys.lists(), accountId] as const,
  details: () => [...businessKeys.all, 'detail'] as const,
  detail: (businessId: number) => [...businessKeys.details(), businessId] as const,
};

// API Functions
async function fetchBusinesses(accountId: number): Promise<Business[]> {
  const response = await fetch(`/api/accounts/${accountId}/businesses`);
  if (!response.ok) {
    throw new Error('Failed to fetch businesses');
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

// Hooks
export function useBusinesses(accountId: number) {
  return useQuery({
    queryKey: businessKeys.list(accountId),
    queryFn: () => fetchBusinesses(accountId),
    enabled: !!accountId,
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
