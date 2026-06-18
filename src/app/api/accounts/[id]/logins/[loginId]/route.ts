import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth-utils';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { encrypt } from '@/lib/encrypt';
import type { Database } from '@/db/db.types';

type LoginUpdate = Database['public']['Tables']['Logins']['Update'];

type LoginRow = {
  id: number;
  clientId: number | null;
  label: string;
  username: string;
  url: string | null;
  note: string | null;
  createdAt: string;
  createdBy: string;
  updatedAt: string | null;
  updatedBy: string | null;
};

// DB column is `note` (singular); the API contract uses `notes`.
function mapLogin(r: LoginRow) {
  return {
    id: r.id,
    accountId: r.clientId,
    label: r.label,
    username: r.username,
    url: r.url,
    notes: r.note,
    createdAt: r.createdAt,
    createdBy: r.createdBy,
    updatedAt: r.updatedAt,
    updatedBy: r.updatedBy,
  };
}

const SELECT =
  'id, clientId, label, username, url, note, createdAt, createdBy, updatedAt, updatedBy';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string; loginId: string }> }
) {
  try {
    await requirePermission({ client: ['update'] });

    const { id, loginId } = await params;
    const accountId = parseInt(id);
    const loginIdInt = parseInt(loginId);
    const body = await request.json();

    if (isNaN(accountId) || isNaN(loginIdInt)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    if (!body.updatedBy) {
      return NextResponse.json({ error: 'Missing updatedBy' }, { status: 400 });
    }

    const updateData: LoginUpdate = {
      updatedBy: body.updatedBy,
      updatedAt: new Date().toISOString(),
    };
    if (body.label !== undefined) updateData.label = body.label;
    if (body.username !== undefined) updateData.username = body.username;
    if (body.password) updateData.password = encrypt(body.password);
    if (body.url !== undefined) updateData.url = body.url || null;
    if (body.notes !== undefined) updateData.note = body.notes || null;

    const { data, error } = await supabaseAdmin
      .from('Logins')
      .update(updateData)
      .eq('id', loginIdInt)
      .eq('clientId', accountId)
      .select(SELECT)
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      return NextResponse.json({ error: 'Login not found' }, { status: 404 });
    }

    return NextResponse.json(mapLogin(data));
  } catch (error) {
    console.error('Error updating client login:', error);
    return NextResponse.json(
      { error: 'Failed to update login' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; loginId: string }> }
) {
  try {
    await requirePermission({ client: ['delete'] });

    const { id, loginId } = await params;
    const accountId = parseInt(id);
    const loginIdInt = parseInt(loginId);

    if (isNaN(accountId) || isNaN(loginIdInt)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    const { data: existing, error: fetchError } = await supabaseAdmin
      .from('Logins')
      .select('id')
      .eq('id', loginIdInt)
      .eq('clientId', accountId)
      .maybeSingle();

    if (fetchError) throw fetchError;
    if (!existing) {
      return NextResponse.json({ error: 'Login not found' }, { status: 404 });
    }

    const { error } = await supabaseAdmin
      .from('Logins')
      .delete()
      .eq('id', loginIdInt)
      .eq('clientId', accountId);

    if (error) throw error;

    return NextResponse.json({ message: 'Login deleted successfully' });
  } catch (error) {
    console.error('Error deleting client login:', error);
    return NextResponse.json(
      { error: 'Failed to delete login' },
      { status: 500 }
    );
  }
}
