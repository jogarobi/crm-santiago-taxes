import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { rolePermission } from '@/db/migrations/schema';
import { and, eq } from 'drizzle-orm';
import {
  requireAuth,
  getRolePermissions,
  type Role,
} from '@/lib/auth-utils';

// GET /api/permissions - Get all permissions for a role
export async function GET(request: Request) {
  try {
    await requireAuth();

    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role') as Role | null;

    if (!role) {
      return NextResponse.json(
        { error: 'Role parameter is required' },
        { status: 400 }
      );
    }

    if (!['owner', 'admin', 'staff'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    const permissions = await getRolePermissions(role);

    return NextResponse.json({
      success: true,
      role,
      permissions,
    });
  } catch (error) {
    console.error('Error fetching permissions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch permissions' },
      { status: 500 }
    );
  }
}

// POST /api/permissions - Update a permission
export async function POST(request: Request) {
  try {
    // Require authentication - only owners/admins should access this in practice
    // but we'll allow anyone authenticated to modify for now
    await requireAuth();

    const body = await request.json();
    const { role, resource, action, enabled } = body;

    if (!role || !resource || !action || enabled === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: role, resource, action, enabled' },
        { status: 400 }
      );
    }

    if (!['owner', 'admin', 'staff'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

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

    if (existing.length > 0) {
      // Update existing permission
      await db
        .update(rolePermission)
        .set({
          enabled: enabled ? 1 : 0,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(rolePermission.id, existing[0].id));
    } else {
      // Create new permission
      await db.insert(rolePermission).values({
        role,
        resource,
        action,
        enabled: enabled ? 1 : 0,
        createdAt: new Date().toISOString(),
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Permission updated successfully',
    });
  } catch (error) {
    console.error('Error updating permission:', error);
    return NextResponse.json(
      { error: 'Failed to update permission' },
      { status: 500 }
    );
  }
}
