import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Touchpoint, CreateTouchpointInput } from '@/lib/types/touchpoint';

// Query Keys
export const touchpointKeys = {
  all: ['touchpoints'] as const,
  lists: () => [...touchpointKeys.all, 'list'] as const,
  list: (params: FetchTouchpointsParams) => [...touchpointKeys.lists(), params] as const,
};

// Types
export interface TouchpointsResponse {
  success: boolean;
  touchpoints: Touchpoint[];
  count: number;
}

export interface TouchpointResponse {
  success: boolean;
  touchpoint: Touchpoint;
}

export interface FetchTouchpointsParams {
  accountId?: number;
  businessId?: number;
  dateFrom?: string;
  dateTo?: string;
}

// API Functions
async function fetchTouchpoints(params: FetchTouchpointsParams): Promise<TouchpointsResponse> {
  const urlParams = new URLSearchParams();

  if (params.accountId !== undefined) {
    urlParams.append('accountId', params.accountId.toString());
  }
  if (params.businessId !== undefined) {
    urlParams.append('businessId', params.businessId.toString());
  }
  if (params.dateFrom) {
    urlParams.append('dateFrom', params.dateFrom);
  }
  if (params.dateTo) {
    urlParams.append('dateTo', params.dateTo);
  }

  const response = await fetch(`/api/touchpoints?${urlParams.toString()}`);
  if (!response.ok) {
    throw new Error('Failed to fetch touchpoints');
  }
  return response.json();
}

async function createTouchpoint(data: CreateTouchpointInput): Promise<TouchpointResponse> {
  const response = await fetch('/api/touchpoints', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error('Failed to create touchpoint');
  }
  return response.json();
}

// Hooks
export function useTouchpoints(params: FetchTouchpointsParams) {
  return useQuery({
    queryKey: touchpointKeys.list(params),
    queryFn: () => fetchTouchpoints(params),
    enabled: !!(params.accountId || params.businessId),
  });
}

export function useCreateTouchpoint() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateTouchpointInput) => createTouchpoint(data),
    onSuccess: (_, variables) => {
      if (variables.accountId) {
        queryClient.invalidateQueries({
          queryKey: touchpointKeys.list({ accountId: variables.accountId }),
        });
      }
      if (variables.businessId) {
        queryClient.invalidateQueries({
          queryKey: touchpointKeys.list({ businessId: variables.businessId }),
        });
      }
    },
  });
}
