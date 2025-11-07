import { useQuery } from '@tanstack/react-query';
import type { Customer, CustomerResponse } from '@/lib/types/customer';

export const customerKeys = {
  all: ['customers'] as const,
  details: () => [...customerKeys.all, 'detail'] as const,
  detail: (id: string) => [...customerKeys.details(), id] as const,
};

async function fetchCustomer(id: string): Promise<Customer> {
  const response = await fetch(`/api/customers/${id}`);

  if (!response.ok) {
    throw new Error('Failed to fetch customer');
  }

  const data: CustomerResponse = await response.json();
  return data.customer;
}

export function useCustomer(id?: string) {
  return useQuery({
    queryKey: customerKeys.detail(id || ''),
    queryFn: () => fetchCustomer(id!),
    enabled: !!id,
  });
}
