import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { activity, activityType } from '@/db/migrations/schema';
import { eq, desc } from 'drizzle-orm';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get('account_id');
    const limit = Math.min(
      parseInt(searchParams.get('limit') || '50'),
      100
    );

    if (!accountId) {
      return NextResponse.json(
        { error: 'account_id is required' },
        { status: 400 }
      );
    }

    const activities = await db
      .select({
        id: activity.id,
        title: activity.title,
        createdAt: activity.createdAt,
        createdBy: activity.createdBy,
        entity: activity.entity,
        entityId: activity.entityId,
        typeName: activityType.name,
        typeIcon: activityType.icon,
      })
      .from(activity)
      .leftJoin(activityType, eq(activity.typeId, activityType.id))
      .where(eq(activity.accountId, parseInt(accountId)))
      .orderBy(desc(activity.createdAt))
      .limit(limit);

    return NextResponse.json({
      success: true,
      activities,
      count: activities.length,
    });
  } catch (error) {
    console.error('Error fetching activities:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch activities',
        message:
          error instanceof Error
            ? error.message
            : 'Internal server error occurred',
      },
      { status: 500 }
    );
  }
}
