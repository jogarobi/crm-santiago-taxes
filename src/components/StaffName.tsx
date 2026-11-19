'use client';

import { useStaffMap } from '@/hooks/use-staff-map';

interface StaffNameProps {
  id?: string | null;
  className?: string;
}

// Legacy/system actor markers that never map to a real staff member.
const SYSTEM_MARKERS = new Set([
  'system',
  'square_sync',
  'square_webhook',
  'unknown',
]);

/**
 * Renders the display name for a createdBy/updatedBy value.
 *
 * Resolves the value against the staff lookup (by auth user id or email).
 * System markers and anything that can't be resolved render as "N/A".
 */
export function StaffName({ id, className }: StaffNameProps) {
  const { data } = useStaffMap();

  const name =
    !id || SYSTEM_MARKERS.has(id.toLowerCase())
      ? null
      : data?.get(id) ?? data?.get(id.toLowerCase());

  if (!name) {
    return (
      <span className={`text-muted-foreground ${className ?? ''}`}>N/A</span>
    );
  }

  return <span className={className}>{name}</span>;
}
