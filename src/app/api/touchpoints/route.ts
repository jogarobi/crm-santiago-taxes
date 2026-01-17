import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { activity, activityType, service } from '@/db/migrations/schema';
import { eq, desc, and } from 'drizzle-orm';
import { requirePermission } from '@/lib/auth-utils';

export async function GET(request: Request) {
  try {
    await requirePermission({ note: ['read'] });

    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get('accountId');
    const businessId = searchParams.get('businessId');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!accountId && !businessId) {
      return NextResponse.json(
        { error: 'Either accountId or businessId is required' },
        { status: 400 }
      );
    }

    const conditions = [];

    if (accountId) {
      const accountIdInt = parseInt(accountId);
      if (isNaN(accountIdInt)) {
        return NextResponse.json(
          { error: 'Invalid account ID' },
          { status: 400 }
        );
      }
      conditions.push(eq(activity.accountId, accountIdInt));
    }

    if (businessId) {
      const businessIdInt = parseInt(businessId);
      if (isNaN(businessIdInt)) {
        return NextResponse.json(
          { error: 'Invalid business ID' },
          { status: 400 }
        );
      }
      conditions.push(eq(activity.businessId, businessIdInt));
    }

    const whereClause = conditions.length > 1
      ? and(...conditions)
      : conditions.length === 1
      ? conditions[0]
      : undefined;

    // Get touchpoints (activities) with their types and optional service info
    const touchpoints = await db
      .select({
        id: activity.id,
        accountId: activity.accountId,
        businessId: activity.businessId,
        typeId: activity.typeId,
        typeName: activityType.name,
        typeIcon: activityType.icon,
        title: activity.title,
        serviceId: activity.entityId,
        serviceName: service.name,
        createdAt: activity.createdAt,
        createdBy: activity.createdBy,
      })
      .from(activity)
      .leftJoin(activityType, eq(activity.typeId, activityType.id))
      .leftJoin(
        service,
        and(
          eq(activity.entity, 'service'),
          eq(activity.entityId, service.id)
        )
      )
      .where(whereClause)
      .orderBy(desc(activity.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({
      success: true,
      touchpoints,
      count: touchpoints.length,
    });
  } catch (error) {
    console.error('Error fetching touchpoints:', error);
    return NextResponse.json(
      { error: 'Failed to fetch touchpoints' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    await requirePermission({ note: ['create'] });

    const body = await request.json();

    if ((!body.accountId && !body.businessId) || !body.type || !body.note || !body.createdBy) {
      return NextResponse.json(
        { error: 'Missing required fields: (accountId or businessId), type, note, createdBy' },
        { status: 400 }
      );
    }

    // Get the typeId from activityType table
    const typeResult = await db
      .select()
      .from(activityType)
      .where(eq(activityType.name, body.type))
      .limit(1);

    if (typeResult.length === 0) {
      return NextResponse.json(
        { error: `Invalid touchpoint type: ${body.type}` },
        { status: 400 }
      );
    }

    const typeId = typeResult[0].id;

    // Create activity record
    const newTouchpoint = await db
      .insert(activity)
      .values({
        accountId: body.accountId ? parseInt(body.accountId) : null,
        businessId: body.businessId ? parseInt(body.businessId) : null,
        typeId: typeId,
        title: body.note,
        entity: body.serviceId ? 'service' : null,
        entityId: body.serviceId ? parseInt(body.serviceId) : null,
        createdBy: body.createdBy,
        createdAt: new Date().toISOString(),
      })
      .returning();

    return NextResponse.json(
      {
        success: true,
        touchpoint: newTouchpoint[0],
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating touchpoint:', error);
    return NextResponse.json(
      { error: 'Failed to create touchpoint' },
      { status: 500 }
    );
  }
}
