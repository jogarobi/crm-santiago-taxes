import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Account, CreateAccountInput, UpdateAccountInput } from '@/lib/types/account';

// Query Keys
export const accountKeys = {
  all: ['accounts'] as const,
  lists: () => [...accountKeys.all, 'list'] as const,
  list: (filters?: Record<string, unknown>) => [...accountKeys.lists(), { filters }] as const,
  details: () => [...accountKeys.all, 'detail'] as const,
  detail: (id: number) => [...accountKeys.details(), id] as const,
};

// API Functions
async function fetchAccounts(search?: string): Promise<Account[]> {
  const url = search
    ? `/api/accounts?search=${encodeURIComponent(search)}`
    : '/api/accounts';

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to fetch accounts');
  }
  return response.json();
}

async function fetchAccount(id: number): Promise<Account> {
  const response = await fetch(`/api/accounts/${id}`);
  if (!response.ok) {
    throw new Error('Failed to fetch account');
  }
  return response.json();
}

async function createAccount(data: CreateAccountInput): Promise<Account> {
  const response = await fetch('/api/accounts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error('Failed to create account');
  }
  return response.json();
}

async function updateAccount(id: number, data: UpdateAccountInput): Promise<Account> {
  const response = await fetch(`/api/accounts/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error('Failed to update account');
  }
  return response.json();
}

async function deleteAccount(id: number): Promise<{ message: string }> {
  const response = await fetch(`/api/accounts/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error('Failed to delete account');
  }
  return response.json();
}

// Hooks
export function useAccounts(search?: string) {
  return useQuery({
    queryKey: accountKeys.list({ search }),
    queryFn: () => fetchAccounts(search),
  });
}

export function useAccount(id: number) {
  return useQuery({
    queryKey: accountKeys.detail(id),
    queryFn: () => fetchAccount(id),
    enabled: !!id,
  });
}

export function useCreateAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createAccount,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: accountKeys.lists() });
    },
  });
}

export function useUpdateAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateAccountInput }) =>
      updateAccount(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: accountKeys.lists() });
      queryClient.invalidateQueries({ queryKey: accountKeys.detail(variables.id) });
    },
  });
}

export function useDeleteAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteAccount,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: accountKeys.lists() });
    },
  });
}
