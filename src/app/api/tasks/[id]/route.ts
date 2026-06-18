import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth-utils';
import { supabaseAdmin } from '@/lib/supabase/admin';
import type { Database } from '@/db/db.types';

type TaskUpdate = Database['public']['Tables']['Tasks']['Update'];

type TaskRow = {
  id: number;
  clientId: number | null;
  businessId: number | null;
  content: string;
  status: string;
  staffId: number;
  createdAt: string;
  createdBy: string;
  updatedAt: string | null;
  updatedBy: string | null;
};

function mapTask(r: TaskRow) {
  return {
    id: r.id,
    accountId: r.clientId,
    businessId: r.businessId,
    content: r.content,
    status: r.status,
    assignedTo: r.staffId != null ? String(r.staffId) : null,
    createdAt: r.createdAt,
    createdBy: r.createdBy,
    updatedAt: r.updatedAt,
    updatedBy: r.updatedBy,
  };
}

// Returns the staff id for the current non-owner user, or null if none.
async function currentStaffId(email: string): Promise<number | null> {
  const { data } = await supabaseAdmin
    .from('Staff')
    .select('id')
    .eq('email', email.toLowerCase())
    .maybeSingle();
  return data?.id ?? null;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { session, role } = await requirePermission({ task: ['read'] });

    const { id } = await params;
    const taskId = parseInt(id);

    if (isNaN(taskId)) {
      return NextResponse.json({ error: 'Invalid task ID' }, { status: 400 });
    }

    const { data: task, error } = await supabaseAdmin
      .from('Tasks')
      .select('*')
      .eq('id', taskId)
      .maybeSingle();

    if (error) throw error;
    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    if (role !== 'owner' && session?.user?.email) {
      const staffId = await currentStaffId(session.user.email);
      if (staffId === null || task.staffId !== staffId) {
        return NextResponse.json(
          { error: 'Access denied. This task is not assigned to you.' },
          { status: 403 }
        );
      }
    }

    return NextResponse.json({ success: true, task: mapTask(task as TaskRow) });
  } catch (error) {
    console.error('Error fetching task:', error);
    return NextResponse.json({ error: 'Failed to fetch task' }, { status: 500 });
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
      return NextResponse.json({ error: 'Invalid task ID' }, { status: 400 });
    }

    if (!body.updatedBy) {
      return NextResponse.json(
        { error: 'Missing required field: updatedBy' },
        { status: 400 }
      );
    }

    const { data: existing, error: fetchError } = await supabaseAdmin
      .from('Tasks')
      .select('*')
      .eq('id', taskId)
      .maybeSingle();

    if (fetchError) throw fetchError;
    if (!existing) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    if (role !== 'owner' && session?.user?.email) {
      const staffId = await currentStaffId(session.user.email);
      if (staffId === null || existing.staffId !== staffId) {
        return NextResponse.json(
          { error: 'Access denied. This task is not assigned to you.' },
          { status: 403 }
        );
      }
    }

    const updateData: TaskUpdate = {
      updatedBy: body.updatedBy,
      updatedAt: new Date().toISOString(),
    };
    if (body.content !== undefined) updateData.content = body.content;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.assignedTo !== undefined)
      updateData.staffId = parseInt(body.assignedTo);
    if (body.accountId !== undefined)
      updateData.clientId = body.accountId == null ? null : Number(body.accountId);
    if (body.businessId !== undefined)
      updateData.businessId =
        body.businessId == null ? null : Number(body.businessId);

    const { data: updated, error } = await supabaseAdmin
      .from('Tasks')
      .update(updateData)
      .eq('id', taskId)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, task: mapTask(updated as TaskRow) });
  } catch (error) {
    console.error('Error updating task:', error);
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 });
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
      return NextResponse.json({ error: 'Invalid task ID' }, { status: 400 });
    }

    const { data: existing, error: fetchError } = await supabaseAdmin
      .from('Tasks')
      .select('*')
      .eq('id', taskId)
      .maybeSingle();

    if (fetchError) throw fetchError;
    if (!existing) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    if (role !== 'owner' && session?.user?.email) {
      const staffId = await currentStaffId(session.user.email);
      if (staffId === null || existing.staffId !== staffId) {
        return NextResponse.json(
          { error: 'Access denied. This task is not assigned to you.' },
          { status: 403 }
        );
      }
    }

    const { error } = await supabaseAdmin.from('Tasks').delete().eq('id', taskId);

    if (error) throw error;

    return NextResponse.json(
      { success: true, message: 'Task deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting task:', error);
    return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 });
  }
}
