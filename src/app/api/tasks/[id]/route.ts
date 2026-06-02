import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { task, staff } from '@/db/migrations/schema';
import { eq } from 'drizzle-orm';
import { requirePermission } from '@/lib/auth-utils';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { session, role } = await requirePermission({ task: ['read'] });

    const { id } = await params;
    const taskId = parseInt(id);

    if (isNaN(taskId)) {
      return NextResponse.json(
        { error: 'Invalid task ID' },
        { status: 400 }
      );
    }

    const result = await db
      .select()
      .from(task)
      .where(eq(task.id, taskId))
      .limit(1);

    if (result.length === 0) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // If user is not an owner, verify they are assigned to this task
    if (role !== 'owner' && session?.user?.email) {
      const staffRecord = await db
        .select()
        .from(staff)
        .where(eq(staff.email, session.user.email.toLowerCase()))
        .limit(1);

      if (
        staffRecord.length === 0 ||
        result[0].assignedTo !== staffRecord[0].id.toString()
      ) {
        return NextResponse.json(
          { error: 'Access denied. This task is not assigned to you.' },
          { status: 403 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      task: result[0],
    });
  } catch (error) {
    console.error('Error fetching task:', error);
    return NextResponse.json(
      { error: 'Failed to fetch task' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { session, role } = await requirePermission({ task: ['update'] });

    const { id } = await params;
    const taskId = parseInt(id);
    const body = await request.json();

    if (isNaN(taskId)) {
      return NextResponse.json(
        { error: 'Invalid task ID' },
        { status: 400 }
      );
    }

    if (!body.updatedBy) {
      return NextResponse.json(
        { error: 'Missing required field: updatedBy' },
        { status: 400 }
      );
    }

    const existingTask = await db
      .select()
      .from(task)
      .where(eq(task.id, taskId))
      .limit(1);

    if (existingTask.length === 0) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // If user is not an owner, verify they are assigned to this task
    if (role !== 'owner' && session?.user?.email) {
      const staffRecord = await db
        .select()
        .from(staff)
        .where(eq(staff.email, session.user.email.toLowerCase()))
        .limit(1);

      if (
        staffRecord.length === 0 ||
        existingTask[0].assignedTo !== staffRecord[0].id.toString()
      ) {
        return NextResponse.json(
          { error: 'Access denied. This task is not assigned to you.' },
          { status: 403 }
        );
      }
    }

    const updateData: any = {
      updatedBy: body.updatedBy,
      updatedAt: new Date().toISOString(),
    };

    if (body.content !== undefined) {
      updateData.content = body.content;
    }

    if (body.status !== undefined) {
      updateData.status = body.status;
    }

    if (body.assignedTo !== undefined) {
      updateData.assignedTo = body.assignedTo;
    }

    if (body.accountId !== undefined) {
      updateData.accountId = body.accountId;
    }

    if (body.businessId !== undefined) {
      updateData.businessId = body.businessId;
    }

    const updatedTask = await db
      .update(task)
      .set(updateData)
      .where(eq(task.id, taskId))
      .returning();

    return NextResponse.json({
      success: true,
      task: updatedTask[0],
    });
  } catch (error) {
    console.error('Error updating task:', error);
    return NextResponse.json(
      { error: 'Failed to update task' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { session, role } = await requirePermission({ task: ['delete'] });

    const { id } = await params;
    const taskId = parseInt(id);

    if (isNaN(taskId)) {
      return NextResponse.json(
        { error: 'Invalid task ID' },
        { status: 400 }
      );
    }

    const existingTask = await db
      .select()
      .from(task)
      .where(eq(task.id, taskId))
      .limit(1);

    if (existingTask.length === 0) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // If user is not an owner, verify they are assigned to this task
    // Note: Staff members typically don't have delete permission anyway
    if (role !== 'owner' && session?.user?.email) {
      const staffRecord = await db
        .select()
        .from(staff)
        .where(eq(staff.email, session.user.email.toLowerCase()))
        .limit(1);

      if (
        staffRecord.length === 0 ||
        existingTask[0].assignedTo !== staffRecord[0].id.toString()
      ) {
        return NextResponse.json(
          { error: 'Access denied. This task is not assigned to you.' },
          { status: 403 }
        );
      }
    }

    await db.delete(task).where(eq(task.id, taskId));

    return NextResponse.json(
      { success: true, message: 'Task deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting task:', error);
    return NextResponse.json(
      { error: 'Failed to delete task' },
      { status: 500 }
    );
  }
}
