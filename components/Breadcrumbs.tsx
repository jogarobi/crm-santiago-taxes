'use client';

import Link from 'next/link';
import { ChevronRightIcon } from 'lucide-react';
import { useBreadcrumbs } from '@/lib/hooks/use-breadcrumbs';

export function Breadcrumbs() {
  const { breadcrumbs } = useBreadcrumbs();

  return (
    <nav aria-label='Breadcrumb' className='flex items-center gap-2 text-sm'>
      {breadcrumbs.map((breadcrumb, index) => {
        const isLast = index === breadcrumbs.length - 1;

        return (
          <div key={breadcrumb.href} className='flex items-center gap-2'>
            {index > 0 && (
              <ChevronRightIcon className='w-4 h-4 text-neutral-400' />
            )}
            {isLast ? (
              <span className='text-neutral-900 font-medium'>
                {breadcrumb.label}
              </span>
            ) : (
              <Link
                href={breadcrumb.href}
                className='text-neutral-600 hover:text-neutral-900 transition-colors'
              >
                {breadcrumb.label}
              </Link>
            )}
          </div>
        );
      })}
    </nav>
  );
}
