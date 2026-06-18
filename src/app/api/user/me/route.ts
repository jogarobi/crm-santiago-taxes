import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth-utils';

export async function GET() {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      role: session.role,
    });
  } catch (error) {
    console.error('Error fetching current user:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user information' },
      { status: 500 }
    );
  }
}
