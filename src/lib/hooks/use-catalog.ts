import { useQuery } from '@tanstack/react-query';
import type {
  CatalogObject,
  CatalogObjectResponse,
  BatchRetrieveCatalogObjectsResponse,
} from '@/lib/types/catalog';

export const catalogKeys = {
  all: ['catalog'] as const,
  objects: () => [...catalogKeys.all, 'objects'] as const,
  object: (id: string) => [...catalogKeys.objects(), id] as const,
  batch: (ids: string[]) => [...catalogKeys.objects(), 'batch', ids] as const,
};

async function fetchCatalogObject(
  objectId: string
): Promise<CatalogObjectResponse> {
  const response = await fetch(`/api/catalog/${objectId}`);

  if (!response.ok) {
    throw new Error('Failed to fetch catalog object');
  }

  const data: CatalogObjectResponse = await response.json();
  return data;
}

async function fetchCatalogObjects(
  objectIds: string[]
): Promise<CatalogObject[]> {
  const response = await fetch('/api/catalog/batch-retrieve', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ objectIds }),
  });

  if (!response.ok) {
    throw new Error('Failed to fetch catalog objects');
  }

  const data: BatchRetrieveCatalogObjectsResponse = await response.json();
  return data.objects;
}

export function useCatalogObjects(objectIds?: string[]) {
  return useQuery({
    queryKey: catalogKeys.batch(objectIds || []),
    queryFn: () => fetchCatalogObjects(objectIds!),
    enabled: !!objectIds && objectIds.length > 0,
  });
}

export function useCatalogObject(objectId?: string) {
  return useQuery({
    queryKey: catalogKeys.object(objectId || ''),
    queryFn: () => fetchCatalogObject(objectId!),
    enabled: !!objectId,
  });
}
