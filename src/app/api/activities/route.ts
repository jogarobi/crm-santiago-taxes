import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get('account_id');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);

    if (!accountId) {
      return NextResponse.json(
        { error: 'account_id is required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from('Activities')
      .select('id, title, createdAt, createdBy, entity, entityId, typeId')
      .eq('clientId', parseInt(accountId))
      .order('createdAt', { ascending: false })
      .limit(limit);

    if (error) throw error;

    const rows = data ?? [];
    const typeIds = Array.from(new Set(rows.map((r) => r.typeId)));
    const typeMap = new Map<number, { name: string; icon: string }>();
    if (typeIds.length > 0) {
      const { data: types } = await supabaseAdmin
        .from('ActitityTypes')
        .select('id, name, icon')
        .in('id', typeIds);
      for (const t of types ?? []) typeMap.set(t.id, { name: t.name, icon: t.icon });
    }

    const activities = rows.map((r) => ({
      id: r.id,
      title: r.title,
      createdAt: r.createdAt,
      createdBy: r.createdBy,
      entity: r.entity,
      entityId: r.entityId,
      typeName: typeMap.get(r.typeId)?.name ?? null,
      typeIcon: typeMap.get(r.typeId)?.icon ?? null,
    }));

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
