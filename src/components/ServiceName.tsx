'use client';

import { useCatalogObject } from '@/hooks/use-catalog';

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

  const relatedItem = catalogResponse?.relatedObjects?.find(
    (obj) => obj.type === 'ITEM'
  );

  const itemName = relatedItem?.itemData?.name;

  const serviceName = itemName || `Service ID: ${serviceVariationId}`;

  return <span className={className}>{serviceName}</span>;
}
