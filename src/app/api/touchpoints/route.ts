import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth-utils';
import { supabaseAdmin, nextId } from '@/lib/supabase/admin';

export async function GET(request: Request) {
  try {
    await requirePermission({ note: ['read'] });

    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get('accountId');
    const businessId = searchParams.get('businessId');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!accountId && !businessId) {
      return NextResponse.json(
        { error: 'Either accountId or businessId is required' },
        { status: 400 }
      );
    }

    let query = supabaseAdmin
      .from('Activities')
      .select('id, clientId, businessId, typeId, title, entity, entityId, createdAt, createdBy');

    if (accountId) {
      const accountIdInt = parseInt(accountId);
      if (isNaN(accountIdInt)) {
        return NextResponse.json({ error: 'Invalid account ID' }, { status: 400 });
      }
      query = query.eq('clientId', accountIdInt);
    }

    if (businessId) {
      const businessIdInt = parseInt(businessId);
      if (isNaN(businessIdInt)) {
        return NextResponse.json({ error: 'Invalid business ID' }, { status: 400 });
      }
      query = query.eq('businessId', businessIdInt);
    }

    if (dateFrom) query = query.gte('createdAt', dateFrom);
    if (dateTo) query = query.lte('createdAt', dateTo);

    const { data, error } = await query
      .order('createdAt', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    const rows = data ?? [];

    // Resolve activity type names/icons (no FK relationship to embed).
    const typeIds = Array.from(new Set(rows.map((r) => r.typeId)));
    const typeMap = new Map<number, { name: string; icon: string }>();
    if (typeIds.length > 0) {
      const { data: types } = await supabaseAdmin
        .from('ActitityTypes')
        .select('id, name, icon')
        .in('id', typeIds);
      for (const t of types ?? []) typeMap.set(t.id, { name: t.name, icon: t.icon });
    }

    // Resolve service names for service-entity touchpoints.
    const serviceIds = Array.from(
      new Set(
        rows
          .filter((r) => r.entity === 'service' && r.entityId != null)
          .map((r) => r.entityId as number)
      )
    );
    const serviceMap = new Map<number, string | null>();
    if (serviceIds.length > 0) {
      const { data: services } = await supabaseAdmin
        .from('Services')
        .select('id, name')
        .in('id', serviceIds);
      for (const s of services ?? []) serviceMap.set(s.id, s.name);
    }

    const touchpoints = rows.map((r) => ({
      id: r.id,
      accountId: r.clientId,
      businessId: r.businessId,
      typeId: r.typeId,
      typeName: typeMap.get(r.typeId)?.name ?? null,
      typeIcon: typeMap.get(r.typeId)?.icon ?? null,
      title: r.title,
      serviceId: r.entityId,
      serviceName:
        r.entity === 'service' && r.entityId != null
          ? serviceMap.get(r.entityId) ?? null
          : null,
      createdAt: r.createdAt,
      createdBy: r.createdBy,
    }));

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

    if (
      (!body.accountId && !body.businessId) ||
      !body.type ||
      !body.note ||
      !body.createdBy
    ) {
      return NextResponse.json(
        {
          error:
            'Missing required fields: (accountId or businessId), type, note, createdBy',
        },
        { status: 400 }
      );
    }

    const { data: typeRow, error: typeError } = await supabaseAdmin
      .from('ActitityTypes')
      .select('id')
      .eq('name', body.type)
      .maybeSingle();

    if (typeError) throw typeError;
    if (!typeRow) {
      return NextResponse.json(
        { error: `Invalid touchpoint type: ${body.type}` },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from('Activities')
      .insert({
        id: await nextId('Activities'),
        clientId: body.accountId ? parseInt(body.accountId) : null,
        businessId: body.businessId ? parseInt(body.businessId) : null,
        typeId: typeRow.id,
        title: body.note,
        entity: body.serviceId ? 'service' : null,
        entityId: body.serviceId ? parseInt(body.serviceId) : null,
        createdBy: body.createdBy,
        createdAt: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(
      {
        success: true,
        touchpoint: { ...data, accountId: data.clientId },
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
