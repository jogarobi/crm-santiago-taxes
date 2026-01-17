import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { service } from '@/db/migrations/schema';
import { eq, desc, like, and, count } from 'drizzle-orm';
import { requirePermission } from '@/lib/auth-utils';

export async function GET(request: Request) {
  try {
    await requirePermission({ service: ['read'] });

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const isActive = searchParams.get('isActive');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const conditions = [];

    if (isActive !== null && isActive !== undefined && isActive !== '') {
      conditions.push(eq(service.isActive, isActive === 'true'));
    }

    if (search && search.trim()) {
      conditions.push(like(service.name, `%${search.trim()}%`));
    }

    const whereClause = conditions.length > 1
      ? and(...conditions)
      : conditions.length === 1
      ? conditions[0]
      : undefined;

    const totalResult = await db
      .select({ count: count() })
      .from(service)
      .where(whereClause);

    const total = totalResult[0]?.count || 0;

    const services = await db
      .select()
      .from(service)
      .where(whereClause)
      .orderBy(desc(service.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({
      success: true,
      services,
      count: services.length,
      total,
      hasMore: offset + services.length < total,
    });
  } catch (error) {
    console.error('Error fetching services:', error);
    return NextResponse.json(
      { error: 'Failed to fetch services' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    await requirePermission({ service: ['create'] });

    const body = await request.json();

    if (!body.name || !body.createdBy) {
      return NextResponse.json(
        { error: 'Missing required fields: name, createdBy' },
        { status: 400 }
      );
    }

    const newService = await db
      .insert(service)
      .values({
        name: body.name,
        isActive: true,
        createdBy: body.createdBy,
        createdAt: new Date().toISOString(),
      })
      .returning();

    return NextResponse.json(
      {
        success: true,
        service: newService[0],
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating service:', error);
    return NextResponse.json(
      { error: 'Failed to create service' },
      { status: 500 }
    );
  }
}
