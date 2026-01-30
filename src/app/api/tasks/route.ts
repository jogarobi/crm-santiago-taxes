import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { task, staff } from '@/db/migrations/schema';
import { eq, desc, like, and, count } from 'drizzle-orm';
import { requirePermission } from '@/lib/auth-utils';

export async function GET(request: Request) {
  try {
    const { session, role } = await requirePermission({ task: ['read'] });

    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get('accountId');
    const businessId = searchParams.get('businessId');
    const status = searchParams.get('status');
    const assignedTo = searchParams.get('assignedTo');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build where conditions
    const conditions = [];

    // If user is not an owner, filter tasks to only show their assigned tasks
    if (role !== 'owner' && session?.user?.email) {
      // Find the staff record for the current user
      const staffRecord = await db
        .select()
        .from(staff)
        .where(eq(staff.email, session.user.email.toLowerCase()))
        .limit(1);

      if (staffRecord.length > 0) {
        // Filter tasks assigned to this staff member
        conditions.push(eq(task.assignedTo, staffRecord[0].id.toString()));
      } else {
        // If no staff record found, return empty results
        return NextResponse.json({
          success: true,
          tasks: [],
          count: 0,
          total: 0,
          hasMore: false,
        });
      }
    }

    if (accountId) {
      const accountIdInt = parseInt(accountId);
      if (isNaN(accountIdInt)) {
        return NextResponse.json(
          { error: 'Invalid account ID' },
          { status: 400 },
        );
      }
      conditions.push(eq(task.accountId, accountIdInt));
    }

    if (businessId) {
      const businessIdInt = parseInt(businessId);
      if (isNaN(businessIdInt)) {
        return NextResponse.json(
          { error: 'Invalid business ID' },
          { status: 400 },
        );
      }
      conditions.push(eq(task.businessId, businessIdInt));
    }

    if (status) {
      conditions.push(eq(task.status, status));
    }

    if (assignedTo) {
      conditions.push(eq(task.assignedTo, assignedTo));
    }

    if (search && search.trim()) {
      conditions.push(like(task.content, `%${search.trim()}%`));
    }

    const whereClause =
      conditions.length > 1
        ? and(...conditions)
        : conditions.length === 1
          ? conditions[0]
          : undefined;

    // Get total count
    const totalResult = await db
      .select({ count: count() })
      .from(task)
      .where(whereClause);

    const total = totalResult[0]?.count || 0;

    // Get paginated tasks
    const tasks = await db
      .select()
      .from(task)
      .where(whereClause)
      .orderBy(desc(task.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({
      success: true,
      tasks,
      count: tasks.length,
      total,
      hasMore: offset + tasks.length < total,
    });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tasks' },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    // Check if user has permission to create tasks
    await requirePermission({ task: ['create'] });

    const body = await request.json();

    if (!body.content || !body.createdBy) {
      return NextResponse.json(
        { error: 'Missing required fields: content, createdBy' },
        { status: 400 },
      );
    }

    const accountIdInt = body.accountId ? parseInt(body.accountId) : null;
    const businessIdInt = body.businessId ? parseInt(body.businessId) : null;

    if (body.accountId && isNaN(Number(accountIdInt))) {
      return NextResponse.json(
        { error: 'Invalid account ID' },
        { status: 400 },
      );
    }

    if (body.businessId && isNaN(Number(businessIdInt))) {
      return NextResponse.json(
        { error: 'Invalid business ID' },
        { status: 400 },
      );
    }

    const newTask = await db
      .insert(task)
      .values({
        accountId: accountIdInt,
        businessId: businessIdInt,
        content: body.content,
        status: body.status || 'todo',
        assignedTo: body.assignedTo || null,
        createdBy: body.createdBy,
        createdAt: new Date().toISOString(),
      })
      .returning();

    return NextResponse.json(
      {
        success: true,
        task: newTask[0],
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('Error creating task:', error);
    return NextResponse.json(
      { error: 'Failed to create task' },
      { status: 500 },
    );
  }
}
