import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-utils';

// PUT /api/permissions/initialize - No-op kept for backwards compatibility.
// Role permissions are now defined by the in-code matrix in auth-utils, so there
// is nothing to seed in the database.
export async function PUT() {
  try {
    await requireAuth();

    return NextResponse.json({
      success: true,
      message: 'Permissions are managed in code; nothing to initialize.',
    });
  } catch (error) {
    console.error('Error initializing permissions:', error);
    return NextResponse.json(
      { error: 'Failed to initialize permissions' },
      { status: 500 }
    );
  }
}
