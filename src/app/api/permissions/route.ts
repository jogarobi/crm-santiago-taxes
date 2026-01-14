import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { rolePermission } from '@/db/migrations/schema';
import { and, eq } from 'drizzle-orm';
import { requireAuth } from '@/lib/auth-utils';

// Define all available permissions based on Better Auth setup
const ALL_PERMISSIONS = [
  // Client permissions
  { resource: 'client', action: 'create', description: 'Can create new clients' },
  { resource: 'client', action: 'read', description: 'Can view client information' },
  { resource: 'client', action: 'update', description: 'Can update client information' },
  { resource: 'client', action: 'delete', description: 'Can delete clients' },

  // Appointment permissions
  { resource: 'appointment', action: 'create', description: 'Can create appointments' },
  { resource: 'appointment', action: 'read', description: 'Can view appointments' },
  { resource: 'appointment', action: 'update', description: 'Can update appointments' },
  { resource: 'appointment', action: 'delete', description: 'Can delete appointments' },
  { resource: 'appointment', action: 'cancel', description: 'Can cancel appointments' },

  // Payment permissions
  { resource: 'payment', action: 'create', description: 'Can create payments' },
  { resource: 'payment', action: 'read', description: 'Can view payments' },
  { resource: 'payment', action: 'refund', description: 'Can refund payments' },

  // Report permissions
  { resource: 'report', action: 'read', description: 'Can view reports' },
  { resource: 'report', action: 'export', description: 'Can export reports' },

  // Staff permissions
  { resource: 'staff', action: 'create', description: 'Can create staff members' },
  { resource: 'staff', action: 'read', description: 'Can view staff information' },
  { resource: 'staff', action: 'update', description: 'Can update staff members' },
  { resource: 'staff', action: 'delete', description: 'Can delete staff members' },
];

// Default permissions for each role from permissions.ts
const DEFAULT_PERMISSIONS = {
  owner: {
    client: ['create', 'read', 'update', 'delete'],
    appointment: ['create', 'read', 'update', 'delete', 'cancel'],
    payment: ['create', 'read', 'refund'],
    report: ['read', 'export'],
    staff: ['create', 'read', 'update', 'delete'],
  },
  admin: {
    client: ['create', 'read', 'update', 'delete'],
    appointment: ['create', 'read', 'update', 'delete', 'cancel'],
    payment: ['create', 'read', 'refund'],
    report: ['read', 'export'],
    staff: ['create', 'read', 'update', 'delete'],
  },
  staff: {
    client: ['create', 'read', 'update'],
    appointment: ['create', 'read', 'update', 'delete', 'cancel'],
    payment: ['read'],
    report: ['read', 'export'],
    staff: ['read'],
  },
};

export async function GET(request: Request) {
  try {
    // Require authentication
    await requireAuth();

    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');

    // Fetch permission overrides from database
    const permissionOverrides = await db
      .select()
      .from(rolePermission)
      .where(role ? eq(rolePermission.role, role) : undefined);

    // Build permission map grouped by role
    const rolePermissions: Record<string, any[]> = {
      owner: [],
      admin: [],
      staff: [],
    };

    // Process each permission and merge with defaults
    ALL_PERMISSIONS.forEach((perm) => {
      ['owner', 'admin', 'staff'].forEach((roleName) => {
        const permId = `${perm.resource}:${perm.action}`;

        // Check if there's a database override
        const override = permissionOverrides.find(
          (o) => o.role === roleName && o.resource === perm.resource && o.action === perm.action
        );

        // Determine if permission is enabled
        let enabled: boolean;
        if (override) {
          // Use database override
          enabled = Boolean(override.enabled);
        } else {
          // Use default from permissions.ts
          const defaultPerms = DEFAULT_PERMISSIONS[roleName as keyof typeof DEFAULT_PERMISSIONS];
          const resourcePerms = defaultPerms[perm.resource as keyof typeof defaultPerms];
          enabled = resourcePerms ? resourcePerms.includes(perm.action) : false;
        }

        rolePermissions[roleName].push({
          id: permId,
          resource: perm.resource,
          action: perm.action,
          description: perm.description,
          enabled,
        });
      });
    });

    // If filtering by role, return only that role's permissions
    if (role && rolePermissions[role]) {
      return NextResponse.json({
        role,
        permissions: rolePermissions[role],
      });
    }

    // Return all roles
    return NextResponse.json(rolePermissions);
  } catch (error) {
    console.error('Error fetching permissions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch permissions' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    // Require authentication
    const session = await requireAuth();

    const body = await request.json();
    const { role, resource, action, enabled } = body;

    if (!role || !resource || !action || enabled === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: role, resource, action, enabled' },
        { status: 400 }
      );
    }

    // Check if permission override already exists
    const existing = await db
      .select()
      .from(rolePermission)
      .where(
        and(
          eq(rolePermission.role, role),
          eq(rolePermission.resource, resource),
          eq(rolePermission.action, action)
        )
      );

    if (existing.length > 0) {
      // Update existing
      const updated = await db
        .update(rolePermission)
        .set({
          enabled,
          updatedAt: new Date().toISOString(),
          updatedBy: session.user.id,
        })
        .where(eq(rolePermission.id, existing[0].id))
        .returning();

      return NextResponse.json(updated[0]);
    } else {
      // Insert new override
      const created = await db
        .insert(rolePermission)
        .values({
          role,
          resource,
          action,
          enabled,
          createdAt: new Date().toISOString(),
          updatedBy: session.user.id,
        })
        .returning();

      return NextResponse.json(created[0], { status: 201 });
    }
  } catch (error) {
    console.error('Error updating permission:', error);
    return NextResponse.json(
      { error: 'Failed to update permission' },
      { status: 500 }
    );
  }
}
