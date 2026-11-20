import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

/**
 * Global recent-activity feed used by the home dashboard.
 *
 * Unlike /api/activities (scoped to a single client), this returns the most
 * recent activities across all clients, optionally bounded by a date range,
 * joined with the client name so each item can link back to its account.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const since = searchParams.get('since');
    const until = searchParams.get('until');

    let query = supabaseAdmin
      .from('Activities')
      .select(
        'id, title, createdAt, createdBy, entity, entityId, typeId, clientId, Clients(firstName, lastName)'
      )
      .order('createdAt', { ascending: false })
      .limit(limit);

    if (since) query = query.gte('createdAt', since);
    if (until) query = query.lte('createdAt', until);

    const { data, error } = await query;

    if (error) throw error;

    const rows = data ?? [];
    const typeIds = Array.from(new Set(rows.map((r) => r.typeId)));
    const typeMap = new Map<number, { name: string; icon: string }>();
    if (typeIds.length > 0) {
      const { data: types } = await supabaseAdmin
        .from('ActitityTypes')
        .select('id, name, icon')
        .in('id', typeIds);
      for (const t of types ?? [])
        typeMap.set(t.id, { name: t.name, icon: t.icon });
    }

    const activities = rows.map((r) => {
      const client = r.Clients as
        | { firstName: string; lastName: string }
        | { firstName: string; lastName: string }[]
        | null;
      const c = Array.isArray(client) ? client[0] : client;
      return {
        id: r.id,
        title: r.title,
        createdAt: r.createdAt,
        createdBy: r.createdBy,
        entity: r.entity,
        entityId: r.entityId,
        clientId: r.clientId,
        accountName: c ? `${c.firstName} ${c.lastName}`.trim() : null,
        typeName: typeMap.get(r.typeId)?.name ?? null,
        typeIcon: typeMap.get(r.typeId)?.icon ?? null,
      };
    });

    return NextResponse.json({
      success: true,
      activities,
      count: activities.length,
    });
  } catch (error) {
    console.error('Error fetching recent activities:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch recent activities',
        message:
          error instanceof Error
            ? error.message
            : 'Internal server error occurred',
      },
      { status: 500 }
    );
  }
}
