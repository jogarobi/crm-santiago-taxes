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
    // Home/Dashboard
    if (pathname === '/') {
      return {
        title: 'Dashboard',
        breadcrumbs: [{ label: 'Dashboard', href: '/' }],
      };
    }

    // Accounts
    if (pathname === '/dashboard/accounts') {
      return {
        title: 'Accounts',
        breadcrumbs: [
          { label: 'Dashboard', href: '/' },
          { label: 'Accounts', href: '/dashboard/accounts' },
        ],
      };
    }

    if (pathname.startsWith('/dashboard/accounts/')) {
      const id = pathname.split('/').pop();
      return {
        title: 'Account Details',
        breadcrumbs: [
          { label: 'Dashboard', href: '/' },
          { label: 'Accounts', href: '/dashboard/accounts' },
          { label: `Account #${id}`, href: pathname },
        ],
      };
    }

    // Appointments
    if (pathname === '/dashboard/appointments') {
      return {
        title: 'Appointments',
        breadcrumbs: [
          { label: 'Dashboard', href: '/' },
          { label: 'Appointments', href: '/dashboard/appointments' },
        ],
      };
    }

    if (pathname.startsWith('/dashboard/appointments/')) {
      const segments = pathname.split('/');
      const id = segments.pop();

      if (segments[segments.length - 1] === 'new') {
        return {
          title: 'New Appointment',
          breadcrumbs: [
            { label: 'Dashboard', href: '/' },
            { label: 'Appointments', href: '/dashboard/appointments' },
            { label: 'New Appointment', href: pathname },
          ],
        };
      }

      return {
        title: 'Appointment Details',
        breadcrumbs: [
          { label: 'Dashboard', href: '/' },
          { label: 'Appointments', href: '/dashboard/appointments' },
          { label: `Appointment #${id}`, href: pathname },
        ],
      };
    }

    // Clients
    if (pathname === '/dashboard/clients') {
      return {
        title: 'Clients',
        breadcrumbs: [
          { label: 'Dashboard', href: '/' },
          { label: 'Clients', href: '/dashboard/clients' },
        ],
      };
    }

    if (pathname.startsWith('/dashboard/clients/')) {
      const id = pathname.split('/').pop();
      return {
        title: 'Client Details',
        breadcrumbs: [
          { label: 'Dashboard', href: '/' },
          { label: 'Clients', href: '/dashboard/clients' },
          { label: `Client #${id}`, href: pathname },
        ],
      };
    }

    // Tasks
    if (pathname === '/dashboard/tasks') {
      return {
        title: 'Tasks',
        breadcrumbs: [
          { label: 'Dashboard', href: '/' },
          { label: 'Tasks', href: '/dashboard/tasks' },
        ],
      };
    }

    // Settings
    if (pathname === '/dashboard/settings') {
      return {
        title: 'Settings',
        breadcrumbs: [
          { label: 'Dashboard', href: '/' },
          { label: 'Settings', href: '/dashboard/settings' },
        ],
      };
    }

    // Default fallback
    const segments = pathname.split('/').filter(Boolean);
    const breadcrumbs: Breadcrumb[] = [{ label: 'Dashboard', href: '/' }];

    let currentPath = '';
    segments.forEach((segment, index) => {
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

    const title = breadcrumbs[breadcrumbs.length - 1]?.label || 'Dashboard';

    return {
      title,
      breadcrumbs,
    };
  }, [pathname]);
}
