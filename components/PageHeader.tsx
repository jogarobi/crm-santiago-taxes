'use client';

import { Breadcrumbs } from './Breadcrumbs';

export function PageHeader() {
  return (
    <div className='flex items-center justify-between w-full'>
      <Breadcrumbs />
      <span className='text-neutral-600 text-sm'>
        {new Date().toDateString()}
      </span>
    </div>
  );
}
