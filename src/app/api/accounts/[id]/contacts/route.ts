import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth-utils';
import { supabaseAdmin, nextId } from '@/lib/supabase/admin';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requirePermission({ client: ['read'] });

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
      .from('Contacts')
      .select('*')
      .eq('clientId', accountId);

    if (error) throw error;

    return NextResponse.json(data ?? []);
  } catch (error) {
    console.error('Error fetching account contacts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch account contacts' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requirePermission({ client: ['create'] });

    const { id } = await params;
    const accountId = parseInt(id);
    const body = await request.json();

    if (isNaN(accountId)) {
      return NextResponse.json({ error: 'Invalid account ID' }, { status: 400 });
    }

    if (!body.createdBy || !body.contactType || !body.contactValue) {
      return NextResponse.json(
        {
          error:
            'Missing required fields: contactType, contactValue, createdBy',
        },
        { status: 400 }
      );
    }

    if (!['email', 'phone'].includes(body.contactType)) {
      return NextResponse.json(
        { error: 'contactType must be "email" or "phone"' },
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

    const { data, error } = await supabaseAdmin
      .from('Contacts')
      .insert({
        id: await nextId('Contacts'),
        clientId: accountId,
        contactType: body.contactType,
        contactValue: body.contactValue,
        createdBy: body.createdBy,
        createdAt: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Error creating account contact:', error);
    return NextResponse.json(
      { error: 'Failed to create account contact' },
      { status: 500 }
    );
  }
}
