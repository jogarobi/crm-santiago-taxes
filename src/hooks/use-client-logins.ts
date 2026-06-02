import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ClientLogin, CreateClientLoginInput, UpdateClientLoginInput } from '@/lib/types/client-login';

export const loginKeys = {
  all: ['client-logins'] as const,
  list: (accountId: number) => [...loginKeys.all, accountId] as const,
};

async function fetchLogins(accountId: number): Promise<ClientLogin[]> {
  const res = await fetch(`/api/accounts/${accountId}/logins`);
  if (!res.ok) throw new Error('Failed to fetch logins');
  return res.json();
}

async function createLogin(accountId: number, data: CreateClientLoginInput): Promise<ClientLogin> {
  const res = await fetch(`/api/accounts/${accountId}/logins`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create login');
  return res.json();
}

async function updateLogin(
  accountId: number,
  loginId: number,
  data: UpdateClientLoginInput
): Promise<ClientLogin> {
  const res = await fetch(`/api/accounts/${accountId}/logins/${loginId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update login');
  return res.json();
}

async function deleteLogin(accountId: number, loginId: number): Promise<void> {
  const res = await fetch(`/api/accounts/${accountId}/logins/${loginId}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete login');
}

async function revealPassword(
  accountId: number,
  loginId: number,
  userPassword: string
): Promise<string> {
  const res = await fetch(`/api/accounts/${accountId}/logins/${loginId}/reveal`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password: userPassword }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to reveal password');
  return data.password;
}

export function useClientLogins(accountId: number) {
  return useQuery({
    queryKey: loginKeys.list(accountId),
    queryFn: () => fetchLogins(accountId),
    enabled: !!accountId,
  });
}

export function useCreateClientLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ accountId, data }: { accountId: number; data: CreateClientLoginInput }) =>
      createLogin(accountId, data),
    onSuccess: (_, { accountId }) => {
      queryClient.invalidateQueries({ queryKey: loginKeys.list(accountId) });
    },
  });
}

export function useUpdateClientLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      accountId,
      loginId,
      data,
    }: {
      accountId: number;
      loginId: number;
      data: UpdateClientLoginInput;
    }) => updateLogin(accountId, loginId, data),
    onSuccess: (_, { accountId }) => {
      queryClient.invalidateQueries({ queryKey: loginKeys.list(accountId) });
    },
  });
}

export function useDeleteClientLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ accountId, loginId }: { accountId: number; loginId: number }) =>
      deleteLogin(accountId, loginId),
    onSuccess: (_, { accountId }) => {
      queryClient.invalidateQueries({ queryKey: loginKeys.list(accountId) });
    },
  });
}

export function useRevealLoginPassword() {
  return useMutation({
    mutationFn: ({
      accountId,
      loginId,
      userPassword,
    }: {
      accountId: number;
      loginId: number;
      userPassword: string;
    }) => revealPassword(accountId, loginId, userPassword),
  });
}
