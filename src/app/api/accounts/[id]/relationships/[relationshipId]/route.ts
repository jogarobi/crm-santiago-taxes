import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth-utils';
import { supabaseAdmin } from '@/lib/supabase/admin';
import type { Database } from '@/db/db.types';

type RelationUpdate = Database['public']['Tables']['ClientRelatives']['Update'];

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

function mapRelation(r: RelationRow) {
  return {
    id: r.id,
    accountId: r.clientId,
    relatedAccountId: r.relatedClientId,
    relationship: r.relationship,
    createdAt: r.createdAt,
    createdBy: r.createdBy,
    updatedAt: r.updatedAt,
    updatedBy: r.updatedBy,
  };
}

async function getOwnedRelation(
  relationshipId: number,
  accountId: number
): Promise<{ row: RelationRow | null; wrongOwner: boolean }> {
  const { data } = await supabaseAdmin
    .from('ClientRelatives')
    .select('*')
    .eq('id', relationshipId)
    .maybeSingle();

  if (!data) return { row: null, wrongOwner: false };
  if (data.clientId !== accountId) return { row: null, wrongOwner: true };
  return { row: data as RelationRow, wrongOwner: false };
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; relationshipId: string }> }
) {
  try {
    await requirePermission({ client: ['read'] });

    const { id, relationshipId } = await params;
    const accountId = parseInt(id);
    const relationshipIdInt = parseInt(relationshipId);

    if (isNaN(accountId) || isNaN(relationshipIdInt)) {
      return NextResponse.json(
        { error: 'Invalid account ID or relationship ID' },
        { status: 400 }
      );
    }

    const { row, wrongOwner } = await getOwnedRelation(
      relationshipIdInt,
      accountId
    );
    if (wrongOwner) {
      return NextResponse.json(
        { error: 'Relationship does not belong to this account' },
        { status: 403 }
      );
    }
    if (!row) {
      return NextResponse.json(
        { error: 'Account relationship not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(mapRelation(row));
  } catch (error) {
    console.error('Error fetching account relationship:', error);
    return NextResponse.json(
      { error: 'Failed to fetch account relationship' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string; relationshipId: string }> }
) {
  try {
    await requirePermission({ client: ['update'] });

    const { id, relationshipId } = await params;
    const accountId = parseInt(id);
    const relationshipIdInt = parseInt(relationshipId);
    const body = await request.json();

    if (isNaN(accountId) || isNaN(relationshipIdInt)) {
      return NextResponse.json(
        { error: 'Invalid account ID or relationship ID' },
        { status: 400 }
      );
    }

    if (!body.updatedBy) {
      return NextResponse.json(
        { error: 'Missing required field: updatedBy' },
        { status: 400 }
      );
    }

    const { row, wrongOwner } = await getOwnedRelation(
      relationshipIdInt,
      accountId
    );
    if (wrongOwner) {
      return NextResponse.json(
        { error: 'Relationship does not belong to this account' },
        { status: 403 }
      );
    }
    if (!row) {
      return NextResponse.json(
        { error: 'Account relationship not found' },
        { status: 404 }
      );
    }

    const updateData: RelationUpdate = {
      updatedBy: body.updatedBy,
      updatedAt: new Date().toISOString(),
    };
    if (body.relatedAccountId !== undefined)
      updateData.relatedClientId = Number(body.relatedAccountId);
    if (body.relationship !== undefined)
      updateData.relationship = body.relationship;

    const { data, error } = await supabaseAdmin
      .from('ClientRelatives')
      .update(updateData)
      .eq('id', relationshipIdInt)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(mapRelation(data as RelationRow));
  } catch (error) {
    console.error('Error updating account relationship:', error);
    return NextResponse.json(
      { error: 'Failed to update account relationship' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; relationshipId: string }> }
) {
  try {
    await requirePermission({ client: ['delete'] });

    const { id, relationshipId } = await params;
    const accountId = parseInt(id);
    const relationshipIdInt = parseInt(relationshipId);

    if (isNaN(accountId) || isNaN(relationshipIdInt)) {
      return NextResponse.json(
        { error: 'Invalid account ID or relationship ID' },
        { status: 400 }
      );
    }

    const { row, wrongOwner } = await getOwnedRelation(
      relationshipIdInt,
      accountId
    );
    if (wrongOwner) {
      return NextResponse.json(
        { error: 'Relationship does not belong to this account' },
        { status: 403 }
      );
    }
    if (!row) {
      return NextResponse.json(
        { error: 'Account relationship not found' },
        { status: 404 }
      );
    }

    const { error } = await supabaseAdmin
      .from('ClientRelatives')
      .delete()
      .eq('id', relationshipIdInt);

    if (error) throw error;

    return NextResponse.json(
      { message: 'Account relationship deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting account relationship:', error);
    return NextResponse.json(
      { error: 'Failed to delete account relationship' },
      { status: 500 }
    );
  }
}
