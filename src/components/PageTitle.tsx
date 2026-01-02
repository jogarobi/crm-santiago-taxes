'use client';

import { useBreadcrumbs } from '@/hooks/use-breadcrumbs';

export function PageTitle() {
  const { title } = useBreadcrumbs();

  return <h1 className='text-2xl font-semibold'>{title}</h1>;
}
