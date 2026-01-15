'use client';

import { usePathname } from 'next/navigation';
import { useMemo } from 'react';

export type Breadcrumb = {
  label: string;
  href: string;
};

export type PageInfo = {
  title: string;
  breadcrumbs: Breadcrumb[];
};

export function useBreadcrumbs(): PageInfo {
  const pathname = usePathname();

  return useMemo(() => {
    if (pathname === '/') {
      return {
        title: 'Home',
        breadcrumbs: [{ label: 'Home', href: '/' }],
      };
    }

    if (pathname === '/appointments') {
      return {
        title: 'Appointments',
        breadcrumbs: [
          { label: 'Home', href: '/' },
          { label: 'Appointments', href: '/appointments' },
        ],
      };
    }

    if (pathname.startsWith('/appointments/')) {
      const segments = pathname.split('/');
      const id = segments.pop();

      if (segments[segments.length - 1] === 'new') {
        return {
          title: 'New Appointment',
          breadcrumbs: [
            { label: 'Home', href: '/' },
            { label: 'Appointments', href: '/appointments' },
            { label: 'New Appointment', href: pathname },
          ],
        };
      }

      return {
        title: 'Appointment Details',
        breadcrumbs: [
          { label: 'Home', href: '/' },
          { label: 'Appointments', href: '/appointments' },
          { label: `Appointment #${id}`, href: pathname },
        ],
      };
    }

    if (pathname === '/clients') {
      return {
        title: 'Clients',
        breadcrumbs: [
          { label: 'Home', href: '/' },
          { label: 'Clients', href: '/clients' },
        ],
      };
    }

    if (pathname === '/businesses') {
      return {
        title: 'Businesses',
        breadcrumbs: [
          { label: 'Home', href: '/' },
          { label: 'Businesses', href: '/businesses' },
        ],
      };
    }

    if (pathname.startsWith('/clients/')) {
      const segments = pathname.split('/').filter(Boolean);

      // Check if it's a business detail page: /clients/[id]/businesses/[businessId]
      if (segments.length === 4 && segments[2] === 'businesses') {
        const clientId = segments[1];
        const businessId = segments[3];
        return {
          title: 'Business Details',
          breadcrumbs: [
            { label: 'Home', href: '/' },
            { label: 'Clients', href: '/clients' },
            { label: `Client #${clientId}`, href: `/clients/${clientId}` },
            { label: `Business #${businessId}`, href: pathname },
          ],
        };
      }

      // Client detail page: /clients/[id]
      const id = segments[1];
      return {
        title: 'Client Details',
        breadcrumbs: [
          { label: 'Home', href: '/' },
          { label: 'Clients', href: '/clients' },
          { label: `Client #${id}`, href: pathname },
        ],
      };
    }

    if (pathname === '/payments') {
      return {
        title: 'Payments',
        breadcrumbs: [
          { label: 'Home', href: '/' },
          { label: 'Payments', href: '/payments' },
        ],
      };
    }

    if (pathname === '/tasks') {
      return {
        title: 'Tasks',
        breadcrumbs: [
          { label: 'Home', href: '/' },
          { label: 'Tasks', href: '/tasks' },
        ],
      };
    }

    if (pathname === '/settings') {
      return {
        title: 'Settings',
        breadcrumbs: [
          { label: 'Home', href: '/' },
          { label: 'Settings', href: '/settings' },
        ],
      };
    }

    const segments = pathname.split('/').filter(Boolean);
    const breadcrumbs: Breadcrumb[] = [{ label: 'Home', href: '/' }];

    let currentPath = '';
    segments.forEach((segment) => {
      currentPath += `/${segment}`;
      const label = segment
        .split('-')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

      breadcrumbs.push({
        label,
        href: currentPath,
      });
    });

    const title = breadcrumbs[breadcrumbs.length - 1]?.label || 'Home';

    return {
      title,
      breadcrumbs,
    };
  }, [pathname]);
}
