import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth-utils';
import { supabaseAdmin, nextId } from '@/lib/supabase/admin';

type ClientLite = { id: number; firstName: string; lastName: string } | null;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ businessId: string }> }
) {
  try {
    await requirePermission({ business: ['read'] });

    const { businessId } = await params;
    const businessIdInt = parseInt(businessId);

    if (isNaN(businessIdInt)) {
      return NextResponse.json({ error: 'Invalid business ID' }, { status: 400 });
    }

    const { data: business, error: businessError } = await supabaseAdmin
      .from('Businesses')
      .select('id')
      .eq('id', businessIdInt)
      .maybeSingle();

    if (businessError) throw businessError;
    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    const { data, error } = await supabaseAdmin
      .from('ClientBusiness')
      .select('id, businessId, clientId, createdAt, createdBy, Clients(id, firstName, lastName)')
      .eq('businessId', businessIdInt);

    if (error) throw error;

    const accounts = (data ?? []).map((row) => ({
      id: row.id,
      businessId: row.businessId,
      accountId: row.clientId,
      createdAt: row.createdAt,
      createdBy: row.createdBy,
      account: row.Clients as ClientLite,
    }));

    return NextResponse.json(accounts);
  } catch (error) {
    console.error('Error fetching business accounts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch business accounts' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ businessId: string }> }
) {
  try {
    await requirePermission({ business: ['update'] });

    const { businessId } = await params;
    const businessIdInt = parseInt(businessId);
    const body = await request.json();

    if (isNaN(businessIdInt)) {
      return NextResponse.json({ error: 'Invalid business ID' }, { status: 400 });
    }

    if (!body.accountId || !body.createdBy) {
      return NextResponse.json(
        { error: 'Missing required fields: accountId, createdBy' },
        { status: 400 }
      );
    }

    const accountIdInt = parseInt(body.accountId);
    if (isNaN(accountIdInt)) {
      return NextResponse.json({ error: 'Invalid account ID' }, { status: 400 });
    }

    const { data: business } = await supabaseAdmin
      .from('Businesses')
      .select('id')
      .eq('id', businessIdInt)
      .maybeSingle();
    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    const { data: account } = await supabaseAdmin
      .from('Clients')
      .select('id')
      .eq('id', accountIdInt)
      .maybeSingle();
    if (!account) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    const { data: existing } = await supabaseAdmin
      .from('ClientBusiness')
      .select('id')
      .eq('businessId', businessIdInt)
      .eq('clientId', accountIdInt)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: 'Account is already associated with this business' },
        { status: 409 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from('ClientBusiness')
      .insert({
        id: await nextId('ClientBusiness'),
        businessId: businessIdInt,
        clientId: accountIdInt,
        createdBy: body.createdBy,
        createdAt: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(
      { ...data, accountId: data.clientId },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error adding account to business:', error);
    return NextResponse.json(
      { error: 'Failed to add account to business' },
      { status: 500 }
    );
  }
}
