import { useQuery } from '@tanstack/react-query';
import type { TeamMember, TeamMemberResponse } from '@/lib/types/team';

export const teamKeys = {
  all: ['team'] as const,
  list: () => [...teamKeys.all, 'list'] as const,
  members: () => [...teamKeys.all, 'members'] as const,
  member: (id: string) => [...teamKeys.members(), id] as const,
};

async function fetchTeamMembers(): Promise<TeamMember[]> {
  const response = await fetch('/api/team');

  if (!response.ok) {
    throw new Error('Failed to fetch team members');
  }

  const data: { success: boolean; teamMembers: TeamMember[] } =
    await response.json();
  return data.teamMembers;
}

async function fetchTeamMember(id: string): Promise<TeamMember> {
  const response = await fetch(`/api/team/${id}`);

  if (!response.ok) {
    throw new Error('Failed to fetch team member');
  }

  const data: TeamMemberResponse = await response.json();
  return data.teamMember;
}

export function useTeamMember(id?: string) {
  return useQuery({
    queryKey: teamKeys.member(id || ''),
    queryFn: () => fetchTeamMember(id!),
    enabled: !!id,
  });
}

export function useTeamMembers() {
  return useQuery({
    queryKey: teamKeys.list(),
    queryFn: fetchTeamMembers,
  });
}
