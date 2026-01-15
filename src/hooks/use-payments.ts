import { useQuery } from '@tanstack/react-query';
import type { Payment } from '@/lib/types/payment';

export interface FetchPaymentsParams {
  pageSize?: number;
  pageIndex?: number;
  beginTime?: string;
  endTime?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface PaymentsResponse {
  data: Payment[];
  meta: {
    total: number;
    pageSize: number;
    pageIndex: number;
    totalPages: number;
  };
}

export const paymentKeys = {
  all: ['payments'] as const,
  lists: () => [...paymentKeys.all, 'list'] as const,
  list: (params?: FetchPaymentsParams) => [...paymentKeys.lists(), params] as const,
};

async function fetchPayments(params?: FetchPaymentsParams): Promise<PaymentsResponse> {
  const urlParams = new URLSearchParams();

  if (params?.pageSize !== undefined) {
    urlParams.append('pageSize', params.pageSize.toString());
  }
  if (params?.pageIndex !== undefined) {
    urlParams.append('pageIndex', params.pageIndex.toString());
  }
  if (params?.beginTime) {
    urlParams.append('beginTime', params.beginTime);
  }
  if (params?.endTime) {
    urlParams.append('endTime', params.endTime);
  }
  if (params?.sortOrder) {
    urlParams.append('sortOrder', params.sortOrder);
  }

  const url = `/api/payments${urlParams.toString() ? `?${urlParams.toString()}` : ''}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to fetch payments');
  }
  return response.json();
}

export function usePayments(params?: FetchPaymentsParams) {
  return useQuery({
    queryKey: paymentKeys.list(params),
    queryFn: () => fetchPayments(params),
  });
}
