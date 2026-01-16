import { useQuery } from '@tanstack/react-query';

export interface CurrentUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

async function fetchCurrentUser(): Promise<CurrentUser> {
  const response = await fetch('/api/user/me');

  if (!response.ok) {
    throw new Error('Failed to fetch current user');
  }

  return response.json();
}

export function useCurrentUser() {
  return useQuery({
    queryKey: ['currentUser'],
    queryFn: fetchCurrentUser,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 1,
  });
}
