import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { staff } from '@/db/migrations/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body.email || !body.userId) {
      return NextResponse.json(
        { error: 'Missing required fields: email, userId' },
        { status: 400 }
      );
    }

    // Find staff member by email and link to user
    const result = await db
      .update(staff)
      .set({
        userId: body.userId,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(staff.email, body.email))
      .returning();

    if (result.length === 0) {
      return NextResponse.json(
        { error: 'No staff member found with that email' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      staff: result[0],
    });
  } catch (error) {
    console.error('Error linking user to staff:', error);
    return NextResponse.json(
      { error: 'Failed to link user to staff member' },
      { status: 500 }
    );
  }
}
