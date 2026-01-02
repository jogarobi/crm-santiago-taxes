import { useQuery } from '@tanstack/react-query';

export type Activity = {
  id: number;
  title: string;
  createdAt: string;
  createdBy: string;
  entity: string | null;
  entityId: number | null;
  typeName: string | null;
  typeIcon: string | null;
};

type ActivitiesResponse = {
  success: boolean;
  activities: Activity[];
  count: number;
};

async function fetchActivities(
  accountId: number,
  limit?: number
): Promise<Activity[]> {
  const params = new URLSearchParams({
    account_id: accountId.toString(),
  });

  if (limit) {
    params.append('limit', limit.toString());
  }

  const response = await fetch(`/api/activities?${params.toString()}`);

  if (!response.ok) {
    throw new Error('Failed to fetch activities');
  }

  const data: ActivitiesResponse = await response.json();
  return data.activities;
}

export function useActivities(accountId: number, limit?: number) {
  return useQuery({
    queryKey: ['activities', accountId, limit],
    queryFn: () => fetchActivities(accountId, limit),
    enabled: !!accountId,
  });
}
