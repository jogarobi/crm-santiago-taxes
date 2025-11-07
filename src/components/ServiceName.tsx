'use client';

import { useCatalogObject } from '@/lib/hooks/use-catalog';

interface ServiceNameProps {
  serviceVariationId?: string | null;
  className?: string;
}

export function ServiceName({
  serviceVariationId,
  className = '',
}: ServiceNameProps) {
  const { data: catalogResponse, isLoading } = useCatalogObject(
    serviceVariationId || undefined
  );

  if (!serviceVariationId) return null;

  if (isLoading) {
    return (
      <span className={`text-sm text-neutral-600 ${className}`}>
        Loading service...
      </span>
    );
  }

  // Get the service name from related objects
  // When fetching a variation, the parent ITEM with the service name is in relatedObjects
  const relatedItem = catalogResponse?.relatedObjects?.find(
    (obj) => obj.type === 'ITEM'
  );

  const itemName = relatedItem?.itemData?.name;
  const variationName = catalogResponse?.object?.itemVariationData?.name;

  // Use item name (the service name) as priority, otherwise use variation name
  const serviceName =
    itemName || variationName || `Service ID: ${serviceVariationId}`;

  return <span className={className}>{serviceName}</span>;
}
