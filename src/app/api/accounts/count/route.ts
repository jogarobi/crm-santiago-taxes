import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { account } from '@/db/migrations/schema';
import { count } from 'drizzle-orm';

export async function GET() {
  try {
    const result = await db
      .select({ count: count() })
      .from(account);

    const totalClients = result[0]?.count || 0;

    return NextResponse.json({
      success: true,
      count: totalClients,
    });
  } catch (error) {
    console.error('Error fetching client count:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch client count'
      },
      { status: 500 }
    );
  }
}