import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth-utils';
import { supabaseAdmin, nextId } from '@/lib/supabase/admin';

export async function GET(request: Request) {
  try {
    await requirePermission({ service: ['read'] });

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const isActive = searchParams.get('isActive');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = supabaseAdmin.from('Services').select('*', { count: 'exact' });

    if (isActive !== null && isActive !== undefined && isActive !== '') {
      query = query.eq('isActive', isActive === 'true' ? 1 : 0);
    }

    if (search && search.trim()) {
      query = query.ilike('name', `%${search.trim()}%`);
    }

    const { data, error, count } = await query
      .order('createdAt', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    const services = data ?? [];
    const total = count ?? 0;

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

    const { data, error } = await supabaseAdmin
      .from('Services')
      .insert({
        id: await nextId('Services'),
        name: body.name,
        isActive: 1,
        createdBy: body.createdBy,
        createdAt: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, service: data }, { status: 201 });
  } catch (error) {
    console.error('Error creating service:', error);
    return NextResponse.json(
      { error: 'Failed to create service' },
      { status: 500 }
    );
  }
}
