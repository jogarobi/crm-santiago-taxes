import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { appointment } from '@/db/migrations/schema';
import { count } from 'drizzle-orm';
import { requirePermission } from '@/lib/auth-utils';

export async function GET() {
  try {
    await requirePermission({ appointment: ['read'] });
    const result = await db.select({ count: count() }).from(appointment);

    const totalAppointments = result[0]?.count || 0;

    return NextResponse.json({
      success: true,
      count: totalAppointments,
    });
  } catch (error) {
    console.error('Error fetching appointment count:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch appointment count',
      },
      { status: 500 }
    );
  }
}
