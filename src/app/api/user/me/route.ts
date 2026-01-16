import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth-utils';
import { db } from '@/lib/db';
import { member } from '@/db/migrations/schema';
import { and, eq } from 'drizzle-orm';

export async function GET() {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    let role = 'staff';

    // Get the member record to find the role
    if (session.session?.activeOrganizationId) {
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
        role = memberRecord[0].role.toLowerCase();
      }
    }

    return NextResponse.json({
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      role,
    });
  } catch (error) {
    console.error('Error fetching current user:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user information' },
      { status: 500 }
    );
  }
}
