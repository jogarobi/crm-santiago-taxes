import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth-utils';
import { supabaseAdmin, nextId } from '@/lib/supabase/admin';

type BusinessRow = {
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
  BusinessTypes?: { id: number; name: string } | null;
};

// Maps a Supabase Businesses row to the shape the frontend expects.
function mapBusiness(b: BusinessRow, accountId: number) {
  return {
    id: b.id,
    accountId,
    registeredName: b.name,
    establishedDate: b.establishedAt,
    ein: b.ein,
    address: b.address,
    city: b.city,
    state: b.state,
    zipCode: b.zipCode,
    entityId: b.typeId,
    createdAt: b.createdAt,
    createdBy: b.createdBy,
    updatedAt: b.updatedAt,
    updatedBy: b.updatedBy,
    entity: b.BusinessTypes
      ? { id: b.BusinessTypes.id, name: b.BusinessTypes.name }
      : undefined,
  };
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requirePermission({ business: ['read'] });

    const { id } = await params;
    const accountId = parseInt(id);

    if (isNaN(accountId)) {
      return NextResponse.json({ error: 'Invalid account ID' }, { status: 400 });
    }

    const { data: account, error: accountError } = await supabaseAdmin
      .from('Clients')
      .select('id')
      .eq('id', accountId)
      .maybeSingle();

    if (accountError) throw accountError;
    if (!account) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    const { data, error } = await supabaseAdmin
      .from('ClientBusiness')
      .select('Businesses(*, BusinessTypes(id, name))')
      .eq('clientId', accountId);

    if (error) throw error;

    const businesses = (data ?? [])
      .map((r) => r.Businesses as BusinessRow | null)
      .filter((b): b is BusinessRow => b !== null)
      .map((b) => mapBusiness(b, accountId));

    return NextResponse.json(businesses);
  } catch (error) {
    console.error('Error fetching businesses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch businesses' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requirePermission({ business: ['create'] });

    const { id } = await params;
    const accountId = parseInt(id);
    const body = await request.json();

    if (isNaN(accountId)) {
      return NextResponse.json({ error: 'Invalid account ID' }, { status: 400 });
    }

    if (!body.registeredName || !body.createdBy) {
      return NextResponse.json(
        { error: 'Missing required fields: registeredName, createdBy' },
        { status: 400 }
      );
    }

    if (body.entityId == null) {
      return NextResponse.json(
        { error: 'Missing required field: entityId (business type)' },
        { status: 400 }
      );
    }

    const { data: account, error: accountError } = await supabaseAdmin
      .from('Clients')
      .select('id')
      .eq('id', accountId)
      .maybeSingle();

    if (accountError) throw accountError;
    if (!account) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    const now = new Date().toISOString();

    const { data: newBusiness, error: createError } = await supabaseAdmin
      .from('Businesses')
      .insert({
        id: await nextId('Businesses'),
        name: body.registeredName,
        establishedAt: body.establishedDate || '',
        ein: body.ein || '',
        address: body.address || '',
        city: body.city || '',
        state: body.state || '',
        zipCode: body.zipCode != null ? String(body.zipCode) : '',
        typeId: Number(body.entityId),
        createdBy: body.createdBy,
        createdAt: now,
      })
      .select('*, BusinessTypes(id, name)')
      .single();

    if (createError) throw createError;

    // Link the business to the client.
    const { error: linkError } = await supabaseAdmin
      .from('ClientBusiness')
      .insert({
        id: await nextId('ClientBusiness'),
        businessId: newBusiness.id,
        clientId: accountId,
        createdBy: body.createdBy,
        createdAt: now,
      });

    if (linkError) throw linkError;

    return NextResponse.json(
      mapBusiness(newBusiness as BusinessRow, accountId),
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating business:', error);
    return NextResponse.json(
      { error: 'Failed to create business' },
      { status: 500 }
    );
  }
}
