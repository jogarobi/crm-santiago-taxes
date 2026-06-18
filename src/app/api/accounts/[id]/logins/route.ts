import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth-utils';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { encrypt } from '@/lib/encrypt';

type LoginRow = {
  id: number;
  clientId: number | null;
  label: string;
  username: string;
  createdAt: string;
  createdBy: string;
  updatedAt: string | null;
  updatedBy: string | null;
};

// The Supabase Logins table has no url/notes columns; they are surfaced as null
// to preserve the existing API shape.
function mapLogin(r: LoginRow) {
  return {
    id: r.id,
    accountId: r.clientId,
    label: r.label,
    username: r.username,
    url: null,
    notes: null,
    createdAt: r.createdAt,
    createdBy: r.createdBy,
    updatedAt: r.updatedAt,
    updatedBy: r.updatedBy,
  };
}

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

    const { data, error } = await supabaseAdmin
      .from('Logins')
      .select('id, clientId, label, username, createdAt, createdBy, updatedAt, updatedBy')
      .eq('clientId', accountId);

    if (error) throw error;

    return NextResponse.json((data ?? []).map(mapLogin));
  } catch (error) {
    console.error('Error fetching client logins:', error);
    return NextResponse.json(
      { error: 'Failed to fetch logins' },
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

    if (!body.label || !body.username || !body.password || !body.createdBy) {
      return NextResponse.json(
        {
          error: 'Missing required fields: label, username, password, createdBy',
        },
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
      .from('Logins')
      .insert({
        clientId: accountId,
        label: body.label,
        username: body.username,
        password: encrypt(body.password),
        createdBy: body.createdBy,
        createdAt: new Date().toISOString(),
      })
      .select('id, clientId, label, username, createdAt, createdBy, updatedAt, updatedBy')
      .single();

    if (error) throw error;

    return NextResponse.json(mapLogin(data), { status: 201 });
  } catch (error) {
    console.error('Error creating client login:', error);
    return NextResponse.json(
      { error: 'Failed to create login' },
      { status: 500 }
    );
  }
}
