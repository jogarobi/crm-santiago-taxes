import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  AccountRelationship,
  CreateAccountRelationshipInput,
  UpdateAccountRelationshipInput,
} from '@/lib/types/account-relationship';

export const accountRelationshipKeys = {
  all: ['account-relationships'] as const,
  lists: () => [...accountRelationshipKeys.all, 'list'] as const,
  list: (accountId?: number) =>
    [...accountRelationshipKeys.lists(), { accountId }] as const,
  details: () => [...accountRelationshipKeys.all, 'detail'] as const,
  detail: (id: number) => [...accountRelationshipKeys.details(), id] as const,
};

async function fetchAccountRelationships(
  accountId: number
): Promise<AccountRelationship[]> {
  const response = await fetch(`/api/accounts/${accountId}/relationships`);
  if (!response.ok) {
    throw new Error('Failed to fetch account relationships');
  }
  return response.json();
}

async function fetchAccountRelationship(
  accountId: number,
  relationshipId: number
): Promise<AccountRelationship> {
  const response = await fetch(
    `/api/accounts/${accountId}/relationships/${relationshipId}`
  );
  if (!response.ok) {
    throw new Error('Failed to fetch account relationship');
  }
  return response.json();
}

async function createAccountRelationship(
  data: CreateAccountRelationshipInput
): Promise<AccountRelationship> {
  const response = await fetch(
    `/api/accounts/${data.accountId}/relationships`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    }
  );
  if (!response.ok) {
    throw new Error('Failed to create account relationship');
  }
  return response.json();
}

async function updateAccountRelationship(
  accountId: number,
  relationshipId: number,
  data: UpdateAccountRelationshipInput
): Promise<AccountRelationship> {
  const response = await fetch(
    `/api/accounts/${accountId}/relationships/${relationshipId}`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    }
  );
  if (!response.ok) {
    throw new Error('Failed to update account relationship');
  }
  return response.json();
}

async function deleteAccountRelationship(
  accountId: number,
  relationshipId: number
): Promise<{ message: string }> {
  const response = await fetch(
    `/api/accounts/${accountId}/relationships/${relationshipId}`,
    {
      method: 'DELETE',
    }
  );
  if (!response.ok) {
    throw new Error('Failed to delete account relationship');
  }
  return response.json();
}

export function useAccountRelationships(accountId: number) {
  return useQuery({
    queryKey: accountRelationshipKeys.list(accountId),
    queryFn: () => fetchAccountRelationships(accountId),
    enabled: !!accountId,
  });
}

export function useAccountRelationship(
  accountId: number,
  relationshipId: number
) {
  return useQuery({
    queryKey: accountRelationshipKeys.detail(relationshipId),
    queryFn: () => fetchAccountRelationship(accountId, relationshipId),
    enabled: !!accountId && !!relationshipId,
  });
}

export function useCreateAccountRelationship() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createAccountRelationship,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: accountRelationshipKeys.lists(),
      });
    },
  });
}

export function useUpdateAccountRelationship() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      accountId,
      relationshipId,
      data,
    }: {
      accountId: number;
      relationshipId: number;
      data: UpdateAccountRelationshipInput;
    }) => updateAccountRelationship(accountId, relationshipId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: accountRelationshipKeys.lists(),
      });
      queryClient.invalidateQueries({
        queryKey: accountRelationshipKeys.detail(variables.relationshipId),
      });
    },
  });
}

export function useDeleteAccountRelationship() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      accountId,
      relationshipId,
    }: {
      accountId: number;
      relationshipId: number;
    }) => deleteAccountRelationship(accountId, relationshipId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: accountRelationshipKeys.lists(),
      });
      queryClient.invalidateQueries({
        queryKey: accountRelationshipKeys.detail(variables.relationshipId),
      });
    },
  });
}
