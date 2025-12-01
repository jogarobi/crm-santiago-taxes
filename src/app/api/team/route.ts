import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { staff } from '@/db/migrations/schema';
import { eq } from 'drizzle-orm';

export async function GET() {
  try {
    const activeStaff = await db
      .select()
      .from(staff)
      .where(eq(staff.status, 'ACTIVE'));

    const teamMembers = activeStaff.map((member) => ({
      id: member.squareId,
      givenName: member.firstName,
      familyName: member.lastName,
      status: member.status,
    }));

    return NextResponse.json({
      success: true,
      teamMembers,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch staff members',
        message:
          error instanceof Error
            ? error.message
            : 'Internal server error occurred',
      },
      { status: 500 }
    );
  }
}
