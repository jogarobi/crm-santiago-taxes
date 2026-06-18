import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth-utils';
import { supabaseAdmin, nextId } from '@/lib/supabase/admin';

type ClientLite = {
  id: number;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
} | null;

type RelationRow = {
  id: number;
  clientId: number;
  relatedClientId: number;
  relationship: string;
  createdAt: string;
  createdBy: string;
  updatedAt: string | null;
  updatedBy: string | null;
};

function mapRelation(r: RelationRow, relatedAccount: ClientLite) {
  return {
    id: r.id,
    accountId: r.clientId,
    relatedAccountId: r.relatedClientId,
    relationship: r.relationship,
    createdAt: r.createdAt,
    createdBy: r.createdBy,
    updatedAt: r.updatedAt,
    updatedBy: r.updatedBy,
    relatedAccount,
    ownerAccountId: r.clientId,
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

    const { data: account, error: accountError } = await supabaseAdmin
      .from('Clients')
      .select('id')
      .eq('id', accountId)
      .maybeSingle();

    if (accountError) throw accountError;
    if (!account) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    const [{ data: direct, error: directError }, { data: inverse, error: inverseError }] =
      await Promise.all([
        supabaseAdmin
          .from('ClientRelatives')
          .select(
            '*, related:Clients!clientrelationships_relatedclientid_fkey(id, firstName, lastName, dateOfBirth)'
          )
          .eq('clientId', accountId),
        supabaseAdmin
          .from('ClientRelatives')
          .select(
            '*, owner:Clients!clientrelationships_clientid_fkey(id, firstName, lastName, dateOfBirth)'
          )
          .eq('relatedClientId', accountId),
      ]);

    if (directError) throw directError;
    if (inverseError) throw inverseError;

    const relationships = [
      ...(direct ?? []).map((r) =>
        mapRelation(r as RelationRow, (r as { related: ClientLite }).related)
      ),
      ...(inverse ?? []).map((r) =>
        mapRelation(r as RelationRow, (r as { owner: ClientLite }).owner)
      ),
    ];

    return NextResponse.json(relationships);
  } catch (error) {
    console.error('Error fetching account relationships:', error);
    return NextResponse.json(
      { error: 'Failed to fetch account relationships' },
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

    if (!body.relatedAccountId || !body.relationship || !body.createdBy) {
      return NextResponse.json(
        {
          error:
            'Missing required fields: relatedAccountId, relationship, createdBy',
        },
        { status: 400 }
      );
    }

    const { data: accounts, error: accountsError } = await supabaseAdmin
      .from('Clients')
      .select('id')
      .in('id', [accountId, Number(body.relatedAccountId)]);

    if (accountsError) throw accountsError;
    const foundIds = new Set((accounts ?? []).map((a) => a.id));
    if (!foundIds.has(accountId)) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }
    if (!foundIds.has(Number(body.relatedAccountId))) {
      return NextResponse.json(
        { error: 'Related account not found' },
        { status: 404 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from('ClientRelatives')
      .insert({
        id: await nextId('ClientRelatives'),
        clientId: accountId,
        relatedClientId: Number(body.relatedAccountId),
        relationship: body.relationship,
        createdBy: body.createdBy,
        createdAt: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(mapRelation(data as RelationRow, null), {
      status: 201,
    });
  } catch (error) {
    console.error('Error creating account relationship:', error);
    return NextResponse.json(
      { error: 'Failed to create account relationship' },
      { status: 500 }
    );
  }
}
