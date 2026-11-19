import { useQuery } from '@tanstack/react-query';
import { type Staff, type StaffResponse } from '@/hooks/use-staff';

/**
 * Builds a lookup from any identifier stored in createdBy/updatedBy
 * (auth user id or email) to the staff member's display name.
 *
 * Used by <StaffName /> so audit fields render as real names instead of
 * raw UUIDs or email addresses.
 */
export function useStaffMap() {
  return useQuery({
    queryKey: ['staff', 'map'],
    queryFn: async () => {
      const res = await fetch('/api/staff?pageSize=1000');
      if (!res.ok) throw new Error('Failed to fetch staff');
      const json: StaffResponse = await res.json();
      return json.data;
    },
    staleTime: 10 * 60_000,
    select: (staff: Staff[]) => {
      const m = new Map<string, string>();
      for (const s of staff) {
        const name = `${s.firstName} ${s.lastName}`.trim();
        if (!name) continue;
        if (s.userId) m.set(s.userId, name);
        if (s.email) m.set(s.email.toLowerCase(), name);
      }
      return m;
    },
  });
}
