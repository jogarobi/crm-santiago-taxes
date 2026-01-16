import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import {
  clientAccount,
  business,
  appointment,
  task,
} from '@/db/migrations/schema';
import { count, eq, sql, and, gte, lte } from 'drizzle-orm';
import { requirePermission } from '@/lib/auth-utils';

export async function GET(_request: Request) {
  try {
    await requirePermission({ client: ['read'] });

    // Get total clients count
    const clientsResult = await db
      .select({ count: count() })
      .from(clientAccount);
    const totalClients = clientsResult[0]?.count || 0;

    // Get total businesses count
    const businessesResult = await db
      .select({ count: count() })
      .from(business);
    const totalBusinesses = businessesResult[0]?.count || 0;

    // Get completed tasks count
    const completedTasksResult = await db
      .select({ count: count() })
      .from(task)
      .where(eq(task.status, 'done'));
    const completedTasks = completedTasksResult[0]?.count || 0;

    // Get businesses due for tax filing in current month (based on anniversary)
    const now = new Date();
    const currentMonth = now.getMonth() + 1; // JavaScript months are 0-indexed

    const businessesDueThisMonth = await db
      .select({
        id: business.id,
        registeredName: business.registeredName,
        establishedDate: business.establishedDate,
      })
      .from(business)
      .where(sql`strftime('%m', ${business.establishedDate}) = ${currentMonth.toString().padStart(2, '0')}`);

    // Get services with appointment counts
    const servicesWithCounts = await db
      .select({
        service: appointment.service,
        count: count(),
      })
      .from(appointment)
      .where(sql`${appointment.service} IS NOT NULL AND ${appointment.service} != ''`)
      .groupBy(appointment.service)
      .orderBy(sql`count(*) DESC`)
      .limit(10);

    return NextResponse.json({
      success: true,
      stats: {
        totalClients,
        totalBusinesses,
        completedTasks,
        businessesDueThisMonth: businessesDueThisMonth.length,
        businessesDueList: businessesDueThisMonth,
        servicesByAppointments: servicesWithCounts,
      },
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch stats',
        message:
          error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
