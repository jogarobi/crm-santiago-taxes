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

async function fetchAccountContact(accountId: number, contactId: number): Promise<AccountContact> {
  const response = await fetch(`/api/accounts/${accountId}/contacts/${contactId}`);
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
  accountId: number,
  contactId: number,
  data: UpdateAccountContactInput
): Promise<AccountContact> {
  const response = await fetch(`/api/accounts/${accountId}/contacts/${contactId}`, {
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

async function deleteAccountContact(accountId: number, contactId: number): Promise<{ message: string }> {
  const response = await fetch(`/api/accounts/${accountId}/contacts/${contactId}`, {
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

export function useAccountContact(accountId: number, contactId: number) {
  return useQuery({
    queryKey: accountContactKeys.detail(contactId),
    queryFn: () => fetchAccountContact(accountId, contactId),
    enabled: !!accountId && !!contactId,
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
      accountId,
      contactId,
      data,
    }: {
      accountId: number;
      contactId: number;
      data: UpdateAccountContactInput;
    }) => updateAccountContact(accountId, contactId, data),
    onSuccess: (updatedContact, variables) => {
      queryClient.invalidateQueries({
        queryKey: accountContactKeys.list(updatedContact.accountId),
      });
      queryClient.invalidateQueries({
        queryKey: accountContactKeys.detail(variables.contactId),
      });
    },
  });
}

export function useDeleteAccountContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ accountId, contactId }: { accountId: number; contactId: number }) =>
      deleteAccountContact(accountId, contactId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: accountContactKeys.list(variables.accountId)
      });
      queryClient.invalidateQueries({
        queryKey: accountContactKeys.detail(variables.contactId),
      });
    },
  });
}
