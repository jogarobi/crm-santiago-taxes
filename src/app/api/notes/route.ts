import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth-utils';
import { supabaseAdmin, nextId } from '@/lib/supabase/admin';

type NoteRow = {
  id: number;
  clientId: number | null;
  businessId: number | null;
  content: string;
  createdAt: string;
  createdBy: string;
  updatedAt: string | null;
  updatedBy: string | null;
};

function mapNote(r: NoteRow) {
  return {
    id: r.id,
    accountId: r.clientId,
    businessId: r.businessId,
    content: r.content,
    createdAt: r.createdAt,
    createdBy: r.createdBy,
    updatedAt: r.updatedAt,
    updatedBy: r.updatedBy,
  };
}

export async function GET(request: Request) {
  try {
    await requirePermission({ note: ['read'] });
    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get('accountId');
    const businessId = searchParams.get('businessId');
    const search = searchParams.get('search');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!accountId && !businessId) {
      return NextResponse.json(
        { error: 'Either accountId or businessId query parameter is required' },
        { status: 400 }
      );
    }

    let query = supabaseAdmin.from('Notes').select('*', { count: 'exact' });

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

    if (search && search.trim())
      query = query.ilike('content', `%${search.trim()}%`);
    if (dateFrom) query = query.gte('createdAt', dateFrom);
    if (dateTo) query = query.lte('createdAt', dateTo);

    const { data, error, count } = await query
      .order('createdAt', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    const notes = (data ?? []).map((r) => mapNote(r as NoteRow));
    const total = count ?? 0;

    return NextResponse.json({
      success: true,
      notes,
      count: notes.length,
      total,
      hasMore: offset + notes.length < total,
    });
  } catch (error) {
    console.error('Error fetching notes:', error);
    return NextResponse.json({ error: 'Failed to fetch notes' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await requirePermission({ note: ['create'] });

    const body = await request.json();

    if (!body.content || !body.createdBy) {
      return NextResponse.json(
        { error: 'Missing required fields: content, createdBy' },
        { status: 400 }
      );
    }

    if (!body.accountId && !body.businessId) {
      return NextResponse.json(
        { error: 'Either accountId or businessId is required' },
        { status: 400 }
      );
    }

    if (body.accountId && isNaN(Number(body.accountId)))
      return NextResponse.json({ error: 'Invalid account ID' }, { status: 400 });
    if (body.businessId && isNaN(Number(body.businessId)))
      return NextResponse.json({ error: 'Invalid business ID' }, { status: 400 });

    const { data, error } = await supabaseAdmin
      .from('Notes')
      .insert({
        id: await nextId('Notes'),
        clientId: body.accountId ? parseInt(body.accountId) : null,
        businessId: body.businessId ? parseInt(body.businessId) : null,
        content: body.content,
        createdBy: body.createdBy,
        createdAt: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(mapNote(data as NoteRow), { status: 201 });
  } catch (error) {
    console.error('Error creating note:', error);
    return NextResponse.json({ error: 'Failed to create note' }, { status: 500 });
  }
}
