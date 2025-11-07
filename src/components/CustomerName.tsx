'use client';

import { useCustomer } from '@/lib/hooks/use-customer';
import { UserIcon } from 'lucide-react';

interface CustomerNameProps {
  customerId?: string | null;
  showIcon?: boolean;
  className?: string;
}

export function CustomerName({
  customerId,
  showIcon = true,
  className = '',
}: CustomerNameProps) {
  const { data: customer, isLoading } = useCustomer(customerId || undefined);

  if (!customerId) return null;

  if (isLoading) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        {showIcon && <UserIcon className='w-4 h-4 text-neutral-500' />}
        <span className='text-sm text-neutral-600'>Loading customer...</span>
      </div>
    );
  }

  const displayName =
    customer?.givenName || customer?.familyName
      ? `${customer?.givenName || ''} ${customer?.familyName || ''}`.trim()
      : `Customer ID: ${customerId}`;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className='text-[15px] text-neutral-700'>{displayName}</span>
    </div>
  );
}
