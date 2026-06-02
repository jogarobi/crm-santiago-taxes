import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth-utils';
import { db } from '@/lib/db';
import { staff } from '@/db/migrations/schema';
import { eq } from 'drizzle-orm';

export async function GET() {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const result = await db
      .select()
      .from(staff)
      .where(eq(staff.userId, session.user.id))
      .limit(1);

    if (result.length === 0) {
      return NextResponse.json({ error: 'Staff record not found' }, { status: 404 });
    }

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error('Error fetching current staff:', error);
    return NextResponse.json({ error: 'Failed to fetch staff record' }, { status: 500 });
  }
}
