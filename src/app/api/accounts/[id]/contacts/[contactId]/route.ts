import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth-utils';
import { supabaseAdmin } from '@/lib/supabase/admin';
import type { Database } from '@/db/db.types';

type ContactUpdate = Database['public']['Tables']['Contacts']['Update'];

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string; contactId: string }> }
) {
  try {
    await requirePermission({ client: ['update'] });

    const { id, contactId } = await params;
    const accountId = parseInt(id);
    const contactIdInt = parseInt(contactId);
    const body = await request.json();

    if (isNaN(accountId) || isNaN(contactIdInt)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    if (!body.updatedBy) {
      return NextResponse.json(
        { error: 'Missing required field: updatedBy' },
        { status: 400 }
      );
    }

    const updateData: ContactUpdate = {
      updatedBy: body.updatedBy,
      updatedAt: new Date().toISOString(),
    };
    if (body.contactType !== undefined)
      updateData.contactType = body.contactType;
    if (body.contactValue !== undefined)
      updateData.contactValue = body.contactValue;

    const { data, error } = await supabaseAdmin
      .from('Contacts')
      .update(updateData)
      .eq('id', contactIdInt)
      .eq('clientId', accountId)
      .select()
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error updating contact:', error);
    return NextResponse.json(
      { error: 'Failed to update contact' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; contactId: string }> }
) {
  try {
    await requirePermission({ client: ['delete'] });

    const { id, contactId } = await params;
    const accountId = parseInt(id);
    const contactIdInt = parseInt(contactId);

    if (isNaN(accountId) || isNaN(contactIdInt)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    const { data: existing, error: fetchError } = await supabaseAdmin
      .from('Contacts')
      .select('id')
      .eq('id', contactIdInt)
      .eq('clientId', accountId)
      .maybeSingle();

    if (fetchError) throw fetchError;
    if (!existing) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
    }

    const { error } = await supabaseAdmin
      .from('Contacts')
      .delete()
      .eq('id', contactIdInt)
      .eq('clientId', accountId);

    if (error) throw error;

    return NextResponse.json({ message: 'Contact deleted successfully' });
  } catch (error) {
    console.error('Error deleting contact:', error);
    return NextResponse.json(
      { error: 'Failed to delete contact' },
      { status: 500 }
    );
  }
}
