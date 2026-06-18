import { NextResponse } from 'next/server';
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

// POST /api/permissions - Permission customization is no longer supported.
// Role permissions are defined by the in-code matrix in auth-utils.
export async function POST() {
  try {
    await requireAuth();

    return NextResponse.json(
      {
        error:
          'Role permissions are managed in code and can no longer be edited at runtime.',
      },
      { status: 501 }
    );
  } catch (error) {
    console.error('Error updating permission:', error);
    return NextResponse.json(
      { error: 'Failed to update permission' },
      { status: 500 }
    );
  }
}
