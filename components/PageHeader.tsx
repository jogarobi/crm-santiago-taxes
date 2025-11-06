'use client';

import { useBreadcrumbs } from '@/lib/hooks/use-breadcrumbs';
import { Breadcrumbs } from './Breadcrumbs';

export function PageHeader() {
  const { title } = useBreadcrumbs();

  return (
    <div className='flex flex-col gap-2'>
      <Breadcrumbs />
      <h1 className='text-2xl font-semibold'>{title}</h1>
    </div>
  );
}
