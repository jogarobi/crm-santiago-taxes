import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { rolePermission } from '@/db/migrations/schema';
import { and, eq } from 'drizzle-orm';

type PermissionCheck = {
  client?: ('create' | 'read' | 'update' | 'delete')[];
  appointment?: ('create' | 'read' | 'update' | 'delete' | 'cancel')[];
  payment?: ('create' | 'read' | 'refund')[];
  report?: ('read' | 'export')[];
  staff?: ('create' | 'read' | 'update' | 'delete')[];
};

export async function getSession() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  return session;
}

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

/**
 * Check if a specific permission override exists in the database
 * Returns null if no override exists (meaning use default from code)
 * Returns true/false if override exists
 */
async function checkDatabasePermission(
  role: string,
  resource: string,
  action: string
): Promise<boolean | null> {
  try {
    const result = await db
      .select()
      .from(rolePermission)
      .where(
        and(
          eq(rolePermission.role, role),
          eq(rolePermission.resource, resource),
          eq(rolePermission.action, action)
        )
      )
      .limit(1);

    if (result.length > 0) {
      return Boolean(result[0].enabled);
    }

    return null; // No override, use default
  } catch (error) {
    console.error('Error checking database permission:', error);
    return null; // On error, fall back to code-based permissions
  }
}

/**
 * Enhanced permission check that considers both database overrides and code-based permissions
 */
async function checkPermissionWithOverrides(
  role: string,
  permissions: PermissionCheck
): Promise<boolean> {
  // Check each resource and action
  for (const [resource, actions] of Object.entries(permissions)) {
    if (!actions || actions.length === 0) continue;

    for (const action of actions) {
      // Check database first
      const dbOverride = await checkDatabasePermission(role, resource, action);

      if (dbOverride !== null) {
        // Database override exists
        if (!dbOverride) {
          return false; // Permission explicitly disabled in database
        }
        // Permission enabled in database, continue checking others
        continue;
      }

      // No database override, check code-based permission
      try {
        await auth.api.hasPermission({
          headers: await headers(),
          body: {
            permissions: {
              [resource]: [action],
            },
          },
        });
        // Permission exists in code, continue
      } catch {
        // Permission not found in code-based system
        return false;
      }
    }
  }

  return true; // All permissions passed
}

export async function requirePermission(permissions: PermissionCheck) {
  const session = await requireAuth();

  // Get user's role from organization membership
  let userRole = 'staff'; // default role
  try {
    const activeRole = await auth.api.organization.getActiveMemberRole({
      headers: await headers(),
    });
    if (activeRole && activeRole.role) {
      userRole = activeRole.role;
    }
  } catch (error) {
    console.error('Error fetching user role:', error);
  }

  // Check permissions with database overrides
  const hasAccess = await checkPermissionWithOverrides(userRole, permissions);

  if (!hasAccess) {
    redirect('/403'); // Redirect to forbidden page
  }

  return session;
}

export async function hasPermission(
  permissions: PermissionCheck
): Promise<boolean> {
  const session = await getSession();

  if (!session) {
    return false;
  }

  // Get user's role from organization membership
  let userRole = 'staff'; // default role
  try {
    const activeRole = await auth.api.organization.getActiveMemberRole({
      headers: await headers(),
    });
    if (activeRole && activeRole.role) {
      userRole = activeRole.role;
    }
  } catch (error) {
    console.error('Error fetching user role:', error);
    return false;
  }

  // Check permissions with database overrides
  return await checkPermissionWithOverrides(userRole, permissions);
}
