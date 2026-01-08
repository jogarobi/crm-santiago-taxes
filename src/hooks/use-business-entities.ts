import { useQuery } from '@tanstack/react-query';
import type { BusinessEntity } from '@/lib/types/business';

// Query Keys
export const businessEntityKeys = {
  all: ['business-entities'] as const,
  lists: () => [...businessEntityKeys.all, 'list'] as const,
};

// API Functions
async function fetchBusinessEntities(): Promise<BusinessEntity[]> {
  const response = await fetch('/api/business-entities');
  if (!response.ok) {
    throw new Error('Failed to fetch business entities');
  }
  return response.json();
}

// Hooks
export function useBusinessEntities() {
  return useQuery({
    queryKey: businessEntityKeys.lists(),
    queryFn: fetchBusinessEntities,
  });
}
