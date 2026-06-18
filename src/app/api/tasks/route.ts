import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth-utils';
import { supabaseAdmin, nextId } from '@/lib/supabase/admin';

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
  Clients?: { firstName: string; lastName: string } | null;
  Businesses?: { name: string } | null;
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
    accountName: r.Clients
      ? `${r.Clients.firstName} ${r.Clients.lastName}`
      : null,
    businessName: r.Businesses?.name ?? null,
  };
}

export async function GET(request: Request) {
  try {
    const { session, role } = await requirePermission({ task: ['read'] });

    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get('accountId');
    const businessId = searchParams.get('businessId');
    const status = searchParams.get('status');
    const assignedTo = searchParams.get('assignedTo');
    const search = searchParams.get('search');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = supabaseAdmin
      .from('Tasks')
      .select('*, Clients(firstName, lastName), Businesses(name)', {
        count: 'exact',
      });

    // Non-owners only see tasks assigned to their staff record.
    if (role !== 'owner' && session?.user?.email) {
      const { data: staffRecord } = await supabaseAdmin
        .from('Staff')
        .select('id')
        .eq('email', session.user.email.toLowerCase())
        .maybeSingle();

      if (!staffRecord) {
        return NextResponse.json({
          success: true,
          tasks: [],
          count: 0,
          total: 0,
          hasMore: false,
        });
      }
      query = query.eq('staffId', staffRecord.id);
    }

    if (accountId) {
      const accountIdInt = parseInt(accountId);
      if (isNaN(accountIdInt))
        return NextResponse.json({ error: 'Invalid account ID' }, { status: 400 });
      query = query.eq('clientId', accountIdInt);
    }

    if (businessId) {
      const businessIdInt = parseInt(businessId);
      if (isNaN(businessIdInt))
        return NextResponse.json({ error: 'Invalid business ID' }, { status: 400 });
      query = query.eq('businessId', businessIdInt);
    }

    if (status) query = query.eq('status', status);
    if (assignedTo) query = query.eq('staffId', parseInt(assignedTo));
    if (search && search.trim())
      query = query.ilike('content', `%${search.trim()}%`);
    if (dateFrom) query = query.gte('createdAt', dateFrom);
    if (dateTo) query = query.lte('createdAt', dateTo);

    const { data, error, count } = await query
      .order('createdAt', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    const tasks = (data ?? []).map((r) => mapTask(r as TaskRow));
    const total = count ?? 0;

    return NextResponse.json({
      success: true,
      tasks,
      count: tasks.length,
      total,
      hasMore: offset + tasks.length < total,
    });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await requirePermission({ task: ['create'] });

    const body = await request.json();

    if (!body.content || !body.createdBy) {
      return NextResponse.json(
        { error: 'Missing required fields: content, createdBy' },
        { status: 400 }
      );
    }

    const accountIdInt = body.accountId ? parseInt(body.accountId) : null;
    const businessIdInt = body.businessId ? parseInt(body.businessId) : null;

    if (body.accountId && isNaN(Number(accountIdInt)))
      return NextResponse.json({ error: 'Invalid account ID' }, { status: 400 });
    if (body.businessId && isNaN(Number(businessIdInt)))
      return NextResponse.json({ error: 'Invalid business ID' }, { status: 400 });

    const staffId = body.assignedTo
      ? parseInt(body.assignedTo)
      : body.staffId
        ? parseInt(body.staffId)
        : null;

    if (staffId == null || isNaN(staffId)) {
      return NextResponse.json(
        { error: 'Missing required field: assignedTo (staff)' },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from('Tasks')
      .insert({
        id: await nextId('Tasks'),
        clientId: accountIdInt,
        businessId: businessIdInt,
        content: body.content,
        status: body.status || 'todo',
        staffId,
        createdBy: body.createdBy,
        createdAt: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(
      { success: true, task: mapTask(data as TaskRow) },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating task:', error);
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 });
  }
}
