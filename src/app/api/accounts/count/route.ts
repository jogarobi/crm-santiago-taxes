import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { clientAccount } from '@/db/migrations/schema';
import { count } from 'drizzle-orm';
import { withAuth } from '@/lib/with-auth';

export const GET = withAuth(async (_req, { session }) => {
  try {
    const result = await db.select({ count: count() }).from(clientAccount);

    const totalClients = result[0]?.count || 0;

    return NextResponse.json({
      success: true,
      count: totalClients,
      userId: session.user.id,
    });
  } catch (error) {
    console.error('Error fetching client count:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch client count',
      },
      { status: 500 }
    );
  }
});
