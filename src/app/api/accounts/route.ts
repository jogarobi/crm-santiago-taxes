import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth-utils';
import { supabaseAdmin, nextId } from '@/lib/supabase/admin';

// Collects the set of client ids that are linked to at least one business.
async function getBusinessClientIds(): Promise<number[]> {
  const { data } = await supabaseAdmin
    .from('ClientBusiness')
    .select('clientId');
  return Array.from(new Set((data ?? []).map((r) => r.clientId)));
}

export async function GET(request: Request) {
  try {
    await requirePermission({ client: ['read'] });
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const onlyWithSquareId = searchParams.get('onlyWithSquareId') === 'true';
    const accountType = searchParams.get('accountType') || 'all';
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const pageIndex = parseInt(searchParams.get('pageIndex') || '0');
    const sortBy = searchParams.get('sortBy');
    const sortDir = searchParams.get('sortDir') as 'asc' | 'desc' | null;
    const createdBy = searchParams.get('createdBy');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    let query = supabaseAdmin
      .from('Clients')
      .select(
        '*, Contacts(contactType, contactValue, createdAt), ClientBusiness(Businesses(id, name))',
        { count: 'exact' }
      );

    if (search) {
      // Find related client ids that match by phone or business name.
      const [{ data: phoneRows }, { data: bizRows }] = await Promise.all([
        supabaseAdmin
          .from('Contacts')
          .select('clientId')
          .ilike('contactValue', `%${search}%`)
          .ilike('contactType', '%phone%'),
        supabaseAdmin
          .from('Businesses')
          .select('id')
          .ilike('name', `%${search}%`),
      ]);

      const phoneClientIds = (phoneRows ?? [])
        .map((r) => r.clientId)
        .filter((id): id is number => id !== null);

      let businessClientIds: number[] = [];
      const bizIds = (bizRows ?? []).map((r) => r.id);
      if (bizIds.length > 0) {
        const { data: links } = await supabaseAdmin
          .from('ClientBusiness')
          .select('clientId')
          .in('businessId', bizIds);
        businessClientIds = (links ?? []).map((r) => r.clientId);
      }

      const relatedIds = Array.from(
        new Set([...phoneClientIds, ...businessClientIds])
      );

      const orParts = [
        `firstName.ilike.%${search}%`,
        `lastName.ilike.%${search}%`,
        `ssnLastFour.ilike.%${search}%`,
      ];
      if (!isNaN(parseInt(search))) orParts.push(`id.eq.${parseInt(search)}`);
      if (relatedIds.length > 0)
        orParts.push(`id.in.(${relatedIds.join(',')})`);

      query = query.or(orParts.join(','));
    }

    if (onlyWithSquareId) {
      query = query.not('squareId', 'is', null);
    }

    if (createdBy) {
      query = query.eq('createdBy', createdBy);
    }

    if (dateFrom) {
      query = query.gte('createdAt', dateFrom);
    }

    if (dateTo) {
      query = query.lte('createdAt', dateTo);
    }

    if (accountType === 'clients' || accountType === 'businesses') {
      const businessClientIds = await getBusinessClientIds();
      if (accountType === 'businesses') {
        if (businessClientIds.length === 0) {
          return NextResponse.json({
            data: [],
            meta: { total: 0, pageSize, pageIndex, totalPages: 0 },
          });
        }
        query = query.in('id', businessClientIds);
      } else if (businessClientIds.length > 0) {
        query = query.not('id', 'in', `(${businessClientIds.join(',')})`);
      }
    }

    if (sortBy === 'name') {
      const ascending = sortDir !== 'desc';
      query = query
        .order('firstName', { ascending })
        .order('lastName', { ascending });
    } else {
      query = query.order('id', { ascending: true });
    }

    const from = pageIndex * pageSize;
    const to = from + pageSize - 1;
    const { data, error, count } = await query.range(from, to);

    if (error) throw error;

    const accounts = (data ?? []).map((row) => {
      const contacts = (row.Contacts ?? []) as Array<{
        contactType: string;
        contactValue: string;
        createdAt: string;
      }>;
      const phone = contacts
        .filter((c) => c.contactType?.toLowerCase().includes('phone'))
        .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))[0];

      const businesses = ((row.ClientBusiness ?? []) as Array<{
        Businesses: { id: number; name: string } | null;
      }>)
        .map((cb) => cb.Businesses)
        .filter((b): b is { id: number; name: string } => b !== null)
        .map((b) => ({ id: b.id, registeredName: b.name }));

      return {
        id: row.id,
        firstName: row.firstName,
        lastName: row.lastName,
        dateOfBirth: row.dateOfBirth,
        ssnLastFour: row.ssnLastFour,
        address: row.address,
        city: row.city,
        state: row.state,
        zipCode: row.zipCode != null ? String(row.zipCode) : null,
        createdBy: row.createdBy,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        updatedBy: row.updatedBy,
        squareId: row.squareId,
        flag: row.flag,
        phoneNumber: phone?.contactValue ?? null,
        businesses,
      };
    });

    const total = count ?? 0;

    return NextResponse.json({
      data: accounts,
      meta: {
        total,
        pageSize,
        pageIndex,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error('Error fetching accounts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch accounts' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    await requirePermission({ client: ['create'] });

    const body = await request.json();

    if (
      !body.firstName ||
      !body.lastName ||
      !body.dateOfBirth ||
      !body.createdBy
    ) {
      return NextResponse.json(
        {
          error:
            'Missing required fields: firstName, lastName, dateOfBirth, createdBy',
        },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from('Clients')
      .insert({
        id: await nextId('Clients'),
        firstName: body.firstName,
        lastName: body.lastName,
        dateOfBirth: body.dateOfBirth,
        ssnLastFour: body.ssnLastFour ?? '',
        address: body.address ?? '',
        city: body.city ?? '',
        state: body.state ?? '',
        zipCode: body.zipCode != null ? Number(body.zipCode) : 0,
        createdBy: body.createdBy,
        createdAt: new Date().toISOString(),
        squareId: body.squareId ?? null,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Error creating account:', error);
    return NextResponse.json(
      { error: 'Failed to create account' },
      { status: 500 }
    );
  }
}
