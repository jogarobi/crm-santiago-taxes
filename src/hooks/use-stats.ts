import { useQuery } from '@tanstack/react-query';

export type StatsPeriod = 'day' | 'month' | 'year' | 'all';

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
  touchpointsByType: Array<{
    typeName: string | null;
    typeIcon: string | null;
    count: number;
  }>;
  mostPopularService: string | null;
};

export type StatsResponse = {
  success: boolean;
  stats: Stats;
};

export type StatsParams = {
  period?: StatsPeriod;
};

const statsKeys = {
  all: ['stats'] as const,
  overview: (params?: StatsParams) => [...statsKeys.all, 'overview', params] as const,
};

async function fetchStats(params?: StatsParams): Promise<Stats> {
  const urlParams = new URLSearchParams();

  if (params?.period) {
    urlParams.append('period', params.period);
  }

  const response = await fetch(`/api/stats?${urlParams.toString()}`);

  if (!response.ok) {
    throw new Error('Failed to fetch stats');
  }

  const data: StatsResponse = await response.json();
  return data.stats;
}

export function useStats(params?: StatsParams) {
  return useQuery({
    queryKey: statsKeys.overview(params),
    queryFn: () => fetchStats(params),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
