import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import {
  clientAccount,
  business,
  appointment,
  task,
  activity,
  activityType,
} from '@/db/migrations/schema';
import { count, eq, sql, and, gte, lte } from 'drizzle-orm';
import { requirePermission } from '@/lib/auth-utils';

export async function GET(request: Request) {
  try {
    await requirePermission({ client: ['read'] });

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'all'; // 'day', 'month', 'year', 'all'

    // Calculate date range based on period
    const now = new Date();
    let startDate: string | null = null;

    if (period === 'day') {
      // Start of today
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      startDate = start.toISOString();
    } else if (period === 'month') {
      // Start of current month
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      startDate = start.toISOString();
    } else if (period === 'year') {
      // Start of current year
      const start = new Date(now.getFullYear(), 0, 1);
      startDate = start.toISOString();
    }

    // Get total clients count (all time - cumulative)
    const clientsResult = await db
      .select({ count: count() })
      .from(clientAccount);
    const totalClients = clientsResult[0]?.count || 0;

    // Get total businesses count (all time - cumulative)
    const businessesResult = await db
      .select({ count: count() })
      .from(business);
    const totalBusinesses = businessesResult[0]?.count || 0;

    // Get completed tasks count with date filter
    const taskConditions = [eq(task.status, 'done')];
    if (startDate) {
      taskConditions.push(gte(task.createdAt, startDate));
    }

    const completedTasksResult = await db
      .select({ count: count() })
      .from(task)
      .where(and(...taskConditions));
    const completedTasks = completedTasksResult[0]?.count || 0;

    // Get businesses due for tax filing in current month (based on anniversary)
    const currentMonth = now.getMonth() + 1; // JavaScript months are 0-indexed

    const businessesDueThisMonth = await db
      .select({
        id: business.id,
        registeredName: business.registeredName,
        establishedDate: business.establishedDate,
      })
      .from(business)
      .where(sql`strftime('%m', ${business.establishedDate}) = ${currentMonth.toString().padStart(2, '0')}`);

    // Get services with appointment counts with date filter
    const appointmentConditions = sql`${appointment.service} IS NOT NULL AND ${appointment.service} != ''`;
    const appointmentDateFilter = startDate
      ? sql`${appointmentConditions} AND ${appointment.createdAt} >= ${startDate}`
      : appointmentConditions;

    const servicesWithCounts = await db
      .select({
        service: appointment.service,
        count: count(),
      })
      .from(appointment)
      .where(appointmentDateFilter)
      .groupBy(appointment.service)
      .orderBy(sql`count(*) DESC`)
      .limit(10);

    // Get touchpoints (activities) grouped by type, ranked by occurrence with date filter
    const activityConditions = [];
    if (startDate) {
      activityConditions.push(gte(activity.createdAt, startDate));
    }

    const touchpointsByType = await db
      .select({
        typeName: activityType.name,
        typeIcon: activityType.icon,
        count: count(),
      })
      .from(activity)
      .leftJoin(activityType, eq(activity.typeId, activityType.id))
      .where(activityConditions.length > 0 ? and(...activityConditions) : undefined)
      .groupBy(activityType.name, activityType.icon)
      .orderBy(sql`count(*) DESC`);

    // Get the most popular service (top service by appointments)
    const mostPopularService =
      servicesWithCounts.length > 0 ? servicesWithCounts[0].service : null;

    return NextResponse.json({
      success: true,
      stats: {
        totalClients,
        totalBusinesses,
        completedTasks,
        businessesDueThisMonth: businessesDueThisMonth.length,
        businessesDueList: businessesDueThisMonth,
        servicesByAppointments: servicesWithCounts,
        touchpointsByType,
        mostPopularService,
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
