import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { clientAccountContact } from '@/db/migrations/schema';
import { eq, and } from 'drizzle-orm';
import { requirePermission } from '@/lib/auth-utils';

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

    const existing = await db
      .select()
      .from(clientAccountContact)
      .where(
        and(
          eq(clientAccountContact.id, contactIdInt),
          eq(clientAccountContact.accountId, accountId)
        )
      )
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {
      updatedBy: body.updatedBy,
      updatedAt: new Date().toISOString(),
    };

    if (body.contactType !== undefined) updateData.contactType = body.contactType;
    if (body.contactValue !== undefined) updateData.contactValue = body.contactValue;

    const updated = await db
      .update(clientAccountContact)
      .set(updateData)
      .where(
        and(
          eq(clientAccountContact.id, contactIdInt),
          eq(clientAccountContact.accountId, accountId)
        )
      )
      .returning();

    return NextResponse.json(updated[0]);
  } catch (error) {
    console.error('Error updating contact:', error);
    return NextResponse.json({ error: 'Failed to update contact' }, { status: 500 });
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

    const existing = await db
      .select()
      .from(clientAccountContact)
      .where(
        and(
          eq(clientAccountContact.id, contactIdInt),
          eq(clientAccountContact.accountId, accountId)
        )
      )
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
    }

    await db
      .delete(clientAccountContact)
      .where(
        and(
          eq(clientAccountContact.id, contactIdInt),
          eq(clientAccountContact.accountId, accountId)
        )
      );

    return NextResponse.json({ message: 'Contact deleted successfully' });
  } catch (error) {
    console.error('Error deleting contact:', error);
    return NextResponse.json({ error: 'Failed to delete contact' }, { status: 500 });
  }
}
