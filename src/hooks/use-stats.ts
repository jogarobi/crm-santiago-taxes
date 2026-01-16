import { useQuery } from '@tanstack/react-query';

export type Stats = {
  totalClients: number;
  totalBusinesses: number;
  completedTasks: number;
  businessesDueThisMonth: number;
  businessesDueList: Array<{
    id: number;
    registeredName: string;
    establishedDate: string;
  }>;
  servicesByAppointments: Array<{
    service: string | null;
    count: number;
  }>;
};

export type StatsResponse = {
  success: boolean;
  stats: Stats;
};

const statsKeys = {
  all: ['stats'] as const,
  overview: () => [...statsKeys.all, 'overview'] as const,
};

async function fetchStats(): Promise<Stats> {
  const response = await fetch('/api/stats');

  if (!response.ok) {
    throw new Error('Failed to fetch stats');
  }

  const data: StatsResponse = await response.json();
  return data.stats;
}

export function useStats() {
  return useQuery({
    queryKey: statsKeys.overview(),
    queryFn: fetchStats,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
