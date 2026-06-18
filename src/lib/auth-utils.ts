import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { cache } from 'react';

// Define all available resources and actions
export type Resource =
  | 'client'
  | 'appointment'
  | 'payment'
  | 'report'
  | 'staff'
  | 'task'
  | 'business'
  | 'note'
  | 'service';

export type Action =
  | 'create'
  | 'read'
  | 'update'
  | 'delete'
  | 'cancel'
  | 'refund'
  | 'export';

export type Role = 'owner' | 'admin' | 'staff';

export type PermissionCheck = Partial<Record<Resource, Action[]>>;

// Default permissions for each role
const DEFAULT_PERMISSIONS: Record<Role, PermissionCheck> = {
  owner: {
    client: ['create', 'read', 'update', 'delete'],
    appointment: ['create', 'read', 'update', 'delete', 'cancel'],
    payment: ['create', 'read', 'refund'],
    report: ['read', 'export'],
    staff: ['create', 'read', 'update', 'delete'],
    task: ['create', 'read', 'update', 'delete'],
    business: ['create', 'read', 'update', 'delete'],
    note: ['create', 'read', 'update', 'delete'],
    service: ['create', 'read', 'update', 'delete'],
  },
  admin: {
    client: ['create', 'read', 'update', 'delete'],
    appointment: ['create', 'read', 'update', 'delete', 'cancel'],
    payment: ['create', 'read'],
    report: ['read', 'export'],
    staff: ['read'],
    task: ['create', 'read', 'update', 'delete'],
    business: ['create', 'read', 'update', 'delete'],
    note: ['create', 'read', 'update', 'delete'],
    service: ['create', 'read', 'update', 'delete'],
  },
  staff: {
    client: ['read'],
    appointment: ['create', 'read', 'update'],
    payment: ['read'],
    report: ['read'],
    staff: ['read'],
    task: ['create', 'read', 'update'],
    business: ['read'],
    note: ['create', 'read', 'update'],
    service: ['read'],
  },
};

function normalizeRole(value: unknown): Role {
  if (typeof value === 'string') {
    const role = value.toLowerCase();
    if (role === 'owner' || role === 'admin' || role === 'staff') {
      return role;
    }
  }
  return 'staff';
}

// cache() deduplicates calls within a single request — avoids redundant auth
// lookups when getSession() is called from requireAuth(), getUserRole(), etc.
export const getSession = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const appMetadata = user.app_metadata ?? {};
  const userMetadata = user.user_metadata ?? {};

  // Role lives in Supabase auth metadata (set via the service role on staff
  // creation). app_metadata is preferred since users cannot edit it themselves.
  const role = normalizeRole(appMetadata.role ?? userMetadata.role);

  return {
    user: {
      id: user.id,
      email: user.email ?? '',
      name:
        (userMetadata.name as string | undefined) ??
        (userMetadata.full_name as string | undefined) ??
        user.email ??
        '',
    },
    role,
  };
});

export async function requireAuth() {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  return session;
}

export async function requireGuest() {
  const session = await getSession();

  if (session) {
    redirect('/');
  }
}

function checkPermissions(role: Role, permissions: PermissionCheck): boolean {
  for (const [resource, actions] of Object.entries(permissions)) {
    if (!actions || actions.length === 0) continue;

    const resourcePerms = DEFAULT_PERMISSIONS[role][resource as Resource];
    for (const action of actions) {
      if (!resourcePerms?.includes(action as Action)) return false;
    }
  }

  return true;
}

/**
 * Returns the best available identifier for the current user (email, then name, then fallback).
 */
export function actorFromSession(session: {
  user: { email?: string | null; name?: string | null };
}): string {
  return session.user.email || session.user.name || 'unknown';
}

/**
 * Require specific permissions or redirect to 403
 */
export async function requirePermission(permissions: PermissionCheck) {
  const session = await requireAuth();
  const userRole = session.role;

  if (!checkPermissions(userRole, permissions)) {
    redirect('/403');
  }

  return { session, role: userRole };
}

/**
 * Check if user has specific permissions (returns boolean)
 */
export async function hasPermission(
  permissions: PermissionCheck
): Promise<boolean> {
  const session = await getSession();

  if (!session) {
    return false;
  }

  return checkPermissions(session.role, permissions);
}

/**
 * Get all permissions for a role from the in-code permission matrix.
 */
export async function getRolePermissions(
  role: Role
): Promise<PermissionCheck> {
  return DEFAULT_PERMISSIONS[role];
}
