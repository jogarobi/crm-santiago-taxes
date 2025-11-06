# Breadcrumbs and Page Titles

This document explains how breadcrumbs and page titles work in the application.

## Overview

The application uses a centralized breadcrumb system that automatically generates breadcrumbs and page titles based on the current route.

## Components

### 1. `useBreadcrumbs` Hook
Located at `lib/hooks/use-breadcrumbs.ts`

Returns page information based on the current pathname:
```typescript
const { title, breadcrumbs } = useBreadcrumbs();
```

### 2. `Breadcrumbs` Component
Located at `components/Breadcrumbs.tsx`

Displays the breadcrumb navigation with chevron separators.

### 3. `PageHeader` Component
Located at `components/PageHeader.tsx`

Combines breadcrumbs and the page title into a single header component.

## Usage

### In Layout
The `PageHeader` component is already integrated into the root layout at `app/layout.tsx`.

### Adding New Routes

To add a new route with breadcrumbs, update the `useBreadcrumbs` hook in `lib/hooks/use-breadcrumbs.ts`:

```typescript
// Example: Adding a new "Reports" page
if (pathname === '/dashboard/reports') {
  return {
    title: 'Reports',
    breadcrumbs: [
      { label: 'Dashboard', href: '/' },
      { label: 'Reports', href: '/dashboard/reports' },
    ],
  };
}
```

### Dynamic Routes

For dynamic routes (with IDs), the hook automatically extracts the ID:

```typescript
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
```

## Page Metadata (Browser Tab Title)

### Server Components
For server components, export metadata:

```typescript
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Page Title | Santiago Taxes CRM',
  description: 'Page description',
};
```

### Client Components
For client components, use `useEffect` to set the document title:

```typescript
'use client';

import { useEffect } from 'react';

export default function Page() {
  useEffect(() => {
    document.title = 'Page Title | Santiago Taxes CRM';
  }, []);

  return <div>Content</div>;
}
```

### Dynamic Titles
For pages with dynamic data:

```typescript
useEffect(() => {
  if (data) {
    document.title = `${data.name} | Santiago Taxes CRM`;
  }
}, [data]);
```

## Current Routes

The following routes are currently configured:

- `/` - Dashboard
- `/dashboard/accounts` - Accounts List
- `/dashboard/accounts/[id]` - Account Details
- `/dashboard/appointments` - Appointments List
- `/dashboard/appointments/[id]` - Appointment Details
- `/dashboard/clients` - Clients List
- `/dashboard/clients/[id]` - Client Details
- `/dashboard/tasks` - Tasks
- `/dashboard/settings` - Settings

## Styling

Breadcrumbs use the following classes:
- Links: `text-neutral-600 hover:text-neutral-900`
- Current page: `text-neutral-900 font-medium`
- Separator: `text-neutral-400` chevron icon

The page title uses: `text-2xl font-semibold`

## Fallback Behavior

If a route is not explicitly configured, the hook will:
1. Split the pathname into segments
2. Capitalize each segment
3. Generate breadcrumbs automatically
4. Use the last segment as the page title

This ensures all pages have breadcrumbs, even if not explicitly configured.
