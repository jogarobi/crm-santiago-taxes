import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  AccountContact,
  CreateAccountContactInput,
  UpdateAccountContactInput,
} from '@/lib/types/account-contact';

export const accountContactKeys = {
  all: ['account-contacts'] as const,
  lists: () => [...accountContactKeys.all, 'list'] as const,
  list: (accountId?: number) =>
    [...accountContactKeys.lists(), { accountId }] as const,
  details: () => [...accountContactKeys.all, 'detail'] as const,
  detail: (id: number) => [...accountContactKeys.details(), id] as const,
};

async function fetchAccountContacts(
  accountId: number
): Promise<AccountContact[]> {
  const response = await fetch(`/api/accounts/${accountId}/contacts`);
  if (!response.ok) {
    throw new Error('Failed to fetch account contacts');
  }
  return response.json();
}

async function fetchAccountContact(id: number): Promise<AccountContact> {
  const response = await fetch(`/api/account-contacts/${id}`);
  if (!response.ok) {
    throw new Error('Failed to fetch account contact');
  }
  return response.json();
}

async function createAccountContact(
  data: CreateAccountContactInput
): Promise<AccountContact> {
  const response = await fetch(`/api/accounts/${data.accountId}/contacts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error('Failed to create account contact');
  }
  return response.json();
}

async function updateAccountContact(
  id: number,
  data: UpdateAccountContactInput
): Promise<AccountContact> {
  const response = await fetch(`/api/account-contacts/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error('Failed to update account contact');
  }
  return response.json();
}

async function deleteAccountContact(id: number): Promise<{ message: string }> {
  const response = await fetch(`/api/account-contacts/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error('Failed to delete account contact');
  }
  return response.json();
}

export function useAccountContacts(accountId: number) {
  return useQuery({
    queryKey: accountContactKeys.list(accountId),
    queryFn: () => fetchAccountContacts(accountId),
    enabled: !!accountId,
  });
}

export function useAccountContact(id: number) {
  return useQuery({
    queryKey: accountContactKeys.detail(id),
    queryFn: () => fetchAccountContact(id),
    enabled: !!id,
  });
}

export function useCreateAccountContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createAccountContact,
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: accountContactKeys.list(data.accountId),
      });
    },
  });
}

export function useUpdateAccountContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number;
      data: UpdateAccountContactInput;
    }) => updateAccountContact(id, data),
    onSuccess: (updatedContact, variables) => {
      queryClient.invalidateQueries({
        queryKey: accountContactKeys.list(updatedContact.accountId),
      });
      queryClient.invalidateQueries({
        queryKey: accountContactKeys.detail(variables.id),
      });
    },
  });
}

export function useDeleteAccountContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteAccountContact,
    onSuccess: (_, accountContactId) => {
      queryClient.invalidateQueries({ queryKey: accountContactKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: accountContactKeys.detail(accountContactId),
      });
    },
  });
}
