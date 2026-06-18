import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth-utils';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function GET(request: Request) {
  try {
    await requirePermission({ client: ['read'] });

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'all'; // 'day', 'month', 'year', 'all'

    const now = new Date();
    let startDate: string | null = null;

    if (period === 'day') {
      startDate = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate()
      ).toISOString();
    } else if (period === 'month') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    } else if (period === 'year') {
      startDate = new Date(now.getFullYear(), 0, 1).toISOString();
    }

    // Totals (cumulative).
    const [{ count: totalClients }, { count: totalBusinesses }] =
      await Promise.all([
        supabaseAdmin.from('Clients').select('id', { count: 'exact', head: true }),
        supabaseAdmin
          .from('Businesses')
          .select('id', { count: 'exact', head: true }),
      ]);

    // Completed tasks (status = done) with optional date filter.
    let completedTasksQuery = supabaseAdmin
      .from('Tasks')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'done');
    if (startDate) completedTasksQuery = completedTasksQuery.gte('createdAt', startDate);
    const { count: completedTasks } = await completedTasksQuery;

    // Businesses due for tax filing this month (by establishedAt month).
    const currentMonth = now.getMonth() + 1;
    const { data: allBusinesses } = await supabaseAdmin
      .from('Businesses')
      .select('id, name, establishedAt');
    const businessesDueList = (allBusinesses ?? [])
      .filter((b) => {
        if (!b.establishedAt) return false;
        const d = new Date(b.establishedAt);
        return !isNaN(d.getTime()) && d.getMonth() + 1 === currentMonth;
      })
      .map((b) => ({
        id: b.id,
        registeredName: b.name,
        establishedDate: b.establishedAt,
      }));

    // Services ranked by appointment count.
    let apptQuery = supabaseAdmin
      .from('Appointments')
      .select('service, createdAt')
      .not('service', 'is', null)
      .neq('service', '');
    if (startDate) apptQuery = apptQuery.gte('createdAt', startDate);
    const { data: apptRows } = await apptQuery;

    const serviceCounts = new Map<string, number>();
    for (const row of apptRows ?? []) {
      if (!row.service) continue;
      serviceCounts.set(row.service, (serviceCounts.get(row.service) ?? 0) + 1);
    }
    const servicesByAppointments = Array.from(serviceCounts.entries())
      .map(([service, count]) => ({ service, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Touchpoints grouped by activity type.
    let activityQuery = supabaseAdmin
      .from('Activities')
      .select('typeId, createdAt');
    if (startDate) activityQuery = activityQuery.gte('createdAt', startDate);
    const { data: activityRows } = await activityQuery;

    const typeCounts = new Map<number, number>();
    for (const row of activityRows ?? []) {
      typeCounts.set(row.typeId, (typeCounts.get(row.typeId) ?? 0) + 1);
    }

    const typeIds = Array.from(typeCounts.keys());
    const typeInfo = new Map<number, { name: string; icon: string }>();
    if (typeIds.length > 0) {
      const { data: types } = await supabaseAdmin
        .from('ActitityTypes')
        .select('id, name, icon')
        .in('id', typeIds);
      for (const t of types ?? [])
        typeInfo.set(t.id, { name: t.name, icon: t.icon });
    }

    const touchpointsByType = Array.from(typeCounts.entries())
      .map(([typeId, count]) => ({
        typeName: typeInfo.get(typeId)?.name ?? null,
        typeIcon: typeInfo.get(typeId)?.icon ?? null,
        count,
      }))
      .sort((a, b) => b.count - a.count);

    const mostPopularService =
      servicesByAppointments.length > 0
        ? servicesByAppointments[0].service
        : null;

    return NextResponse.json({
      success: true,
      stats: {
        totalClients: totalClients ?? 0,
        totalBusinesses: totalBusinesses ?? 0,
        completedTasks: completedTasks ?? 0,
        businessesDueThisMonth: businessesDueList.length,
        businessesDueList,
        servicesByAppointments,
        touchpointsByType,
        mostPopularService,
      },
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch stats',
        message:
          error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
