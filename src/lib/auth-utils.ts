import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { rolePermission } from '@/db/migrations/schema';
import { and, eq } from 'drizzle-orm';

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
 * Get the user's role from the session
 */
async function getUserRole(): Promise<Role> {
  try {
    // Try to get role from Better Auth organization membership
    const session = await getSession();
    if (!session?.session?.activeOrganizationId) {
      return 'staff';
    }

    // Get the member record to find the role
    const { member } = await import('@/db/migrations/schema');
    const memberRecord = await db
      .select()
      .from(member)
      .where(
        and(
          eq(member.userId, session.user.id),
          eq(member.organizationId, session.session.activeOrganizationId)
        )
      )
      .limit(1);

    if (memberRecord.length > 0 && memberRecord[0].role) {
      const role = memberRecord[0].role.toLowerCase();
      if (role === 'owner' || role === 'admin' || role === 'staff') {
        return role as Role;
      }
    }
  } catch (error) {
    console.error('Error fetching user role:', error);
  }

  return 'staff'; // default role
}

/**
 * Check if a specific permission exists in the database
 * Returns the permission setting from DB, or null if not found
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

    return null; // No database record, use default
  } catch (error) {
    console.error('Error checking database permission:', error);
    return null;
  }
}

/**
 * Check permissions using database-first approach with default fallback
 */
async function checkPermissions(
  role: Role,
  permissions: PermissionCheck
): Promise<boolean> {
  // Check each resource and action
  for (const [resource, actions] of Object.entries(permissions)) {
    if (!actions || actions.length === 0) continue;

    for (const action of actions) {
      // Check database first
      const dbPermission = await checkDatabasePermission(
        role,
        resource,
        action
      );

      if (dbPermission !== null) {
        // Database has explicit permission setting
        if (!dbPermission) {
          return false; // Permission explicitly disabled
        }
        continue; // Permission enabled, check next
      }

      // No database record, use default permissions
      const defaultPerms = DEFAULT_PERMISSIONS[role];
      const resourcePerms = defaultPerms[resource as Resource];

      if (!resourcePerms || !resourcePerms.includes(action as Action)) {
        return false; // No default permission
      }
    }
  }

  return true; // All permissions passed
}

/**
 * Require specific permissions or redirect to 403
 */
export async function requirePermission(permissions: PermissionCheck) {
  const session = await requireAuth();
  const userRole = await getUserRole();

  const hasAccess = await checkPermissions(userRole, permissions);

  if (!hasAccess) {
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

  const userRole = await getUserRole();
  return await checkPermissions(userRole, permissions);
}

/**
 * Get all permissions for a role from database and defaults
 */
export async function getRolePermissions(
  role: Role
): Promise<PermissionCheck> {
  try {
    const dbPerms = await db
      .select()
      .from(rolePermission)
      .where(eq(rolePermission.role, role));

    // Start with default permissions
    const permissions: PermissionCheck = JSON.parse(
      JSON.stringify(DEFAULT_PERMISSIONS[role])
    );

    // Override with database permissions
    for (const perm of dbPerms) {
      const resource = perm.resource as Resource;
      const action = perm.action as Action;

      if (!permissions[resource]) {
        permissions[resource] = [];
      }

      if (perm.enabled && !permissions[resource]!.includes(action)) {
        permissions[resource]!.push(action);
      } else if (!perm.enabled) {
        permissions[resource] = permissions[resource]!.filter(
          (a) => a !== action
        );
      }
    }

    return permissions;
  } catch (error) {
    console.error('Error getting role permissions:', error);
    return DEFAULT_PERMISSIONS[role];
  }
}

/**
 * Initialize default permissions in the database
 */
export async function initializeDefaultPermissions() {
  try {
    for (const [role, resources] of Object.entries(DEFAULT_PERMISSIONS)) {
      for (const [resource, actions] of Object.entries(resources)) {
        for (const action of actions) {
          // Check if permission already exists
          const existing = await db
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

          if (existing.length === 0) {
            await db.insert(rolePermission).values({
              role,
              resource,
              action,
              enabled: 1,
              createdAt: new Date().toISOString(),
            });
          }
        }
      }
    }
    return { success: true };
  } catch (error) {
    console.error('Error initializing permissions:', error);
    return { success: false, error };
  }
}
