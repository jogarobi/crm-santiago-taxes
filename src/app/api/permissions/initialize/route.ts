import { NextResponse } from 'next/server';
import { initializeDefaultPermissions, requireAuth } from '@/lib/auth-utils';

// PUT /api/permissions/initialize - Initialize default permissions
export async function PUT(request: Request) {
  try {
    // Require authentication (any authenticated user can initialize)
    await requireAuth();

    const result = await initializeDefaultPermissions();

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Default permissions initialized successfully',
      });
    } else {
      return NextResponse.json(
        { error: 'Failed to initialize permissions', details: result.error },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error initializing permissions:', error);
    return NextResponse.json(
      { error: 'Failed to initialize permissions' },
      { status: 500 }
    );
  }
}
