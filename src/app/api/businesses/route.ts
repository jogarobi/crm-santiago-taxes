import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth-utils';
import { supabaseAdmin } from '@/lib/supabase/admin';

type ClientLite = { id: number; firstName: string; lastName: string };

type BusinessListRow = {
  id: number;
  name: string;
  establishedAt: string;
  ein: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  typeId: number;
  createdAt: string;
  createdBy: string;
  updatedAt: string | null;
  updatedBy: string | null;
  BusinessTypes: { id: number; name: string } | null;
  ClientBusiness: { Clients: ClientLite | null }[] | null;
};

export async function GET(request: Request) {
  try {
    await requirePermission({ business: ['read'] });
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const pageIndex = parseInt(searchParams.get('pageIndex') || '0');
    const sortBy = searchParams.get('sortBy');
    const sortDir = searchParams.get('sortDir') as 'asc' | 'desc' | null;
    const createdBy = searchParams.get('createdBy');

    let query = supabaseAdmin
      .from('Businesses')
      .select(
        '*, BusinessTypes(id, name), ClientBusiness(Clients(id, firstName, lastName))',
        { count: 'exact' }
      );

    if (search && search.trim()) {
      const term = search.trim();

      // Businesses linked to clients whose name matches the search.
      const { data: clientRows } = await supabaseAdmin
        .from('Clients')
        .select('id')
        .or(`firstName.ilike.%${term}%,lastName.ilike.%${term}%`);
      const clientIds = (clientRows ?? []).map((c) => c.id);

      let nameLinkedBusinessIds: number[] = [];
      if (clientIds.length > 0) {
        const { data: links } = await supabaseAdmin
          .from('ClientBusiness')
          .select('businessId')
          .in('clientId', clientIds);
        nameLinkedBusinessIds = (links ?? []).map((l) => l.businessId);
      }

      const orParts = [`name.ilike.%${term}%`, `ein.ilike.%${term}%`];
      if (nameLinkedBusinessIds.length > 0) {
        orParts.push(`id.in.(${Array.from(new Set(nameLinkedBusinessIds)).join(',')})`);
      }
      query = query.or(orParts.join(','));
    }

    if (createdBy) {
      query = query.eq('createdBy', createdBy);
    }

    if (sortBy === 'name') {
      query = query.order('name', { ascending: sortDir !== 'desc' });
    } else {
      query = query.order('createdAt', { ascending: false });
    }

    const from = pageIndex * pageSize;
    const to = from + pageSize - 1;
    const { data, error, count } = await query.range(from, to);

    if (error) throw error;

    const businesses = (data ?? []).map((row) => {
      const r = row as BusinessListRow;
      const firstClient = (r.ClientBusiness ?? [])
        .map((cb) => cb.Clients)
        .filter((c): c is ClientLite => c !== null)[0];

      return {
        id: r.id,
        accountId: firstClient?.id ?? null,
        registeredName: r.name,
        establishedDate: r.establishedAt,
        ein: r.ein,
        address: r.address,
        city: r.city,
        state: r.state,
        zipCode: r.zipCode,
        createdAt: r.createdAt,
        createdBy: r.createdBy,
        updatedAt: r.updatedAt,
        updatedBy: r.updatedBy,
        entityId: r.typeId,
        entity: r.BusinessTypes
          ? { id: r.BusinessTypes.id, name: r.BusinessTypes.name }
          : undefined,
        account: firstClient
          ? {
              id: firstClient.id,
              firstName: firstClient.firstName,
              lastName: firstClient.lastName,
            }
          : undefined,
      };
    });

    const total = count ?? 0;

    return NextResponse.json({
      data: businesses,
      meta: {
        total,
        pageIndex,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error('Error fetching businesses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch businesses' },
      { status: 500 }
    );
  }
}
