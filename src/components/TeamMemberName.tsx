'use client';

import { useTeamMember } from '@/lib/hooks/use-team';

interface TeamMemberNameProps {
  teamMemberId?: string | null;
  className?: string;
}

export function TeamMemberName({
  teamMemberId,
  className = '',
}: TeamMemberNameProps) {
  const { data: teamMember, isLoading } = useTeamMember(
    teamMemberId || undefined
  );

  if (!teamMemberId) return null;

  if (isLoading) {
    return (
      <span className={`text-sm text-neutral-600 ${className}`}>
        Loading...
      </span>
    );
  }

  const displayName =
    teamMember?.givenName || teamMember?.familyName
      ? `${teamMember?.givenName || ''} ${teamMember?.familyName || ''}`.trim()
      : '';

  if (!displayName) return null;

  return <span className={className}>{displayName}</span>;
}
