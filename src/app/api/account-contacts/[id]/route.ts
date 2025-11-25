import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { accountContact } from '@/db/migrations/schema';
import { eq } from 'drizzle-orm';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const contactId = parseInt(id);

    if (isNaN(contactId)) {
      return NextResponse.json(
        { error: 'Invalid contact ID' },
        { status: 400 }
      );
    }

    const result = await db
      .select()
      .from(accountContact)
      .where(eq(accountContact.id, contactId))
      .limit(1);

    if (result.length === 0) {
      return NextResponse.json(
        { error: 'Account contact not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error('Error fetching account contact:', error);
    return NextResponse.json(
      { error: 'Failed to fetch account contact' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const contactId = parseInt(id);
    const body = await request.json();

    if (isNaN(contactId)) {
      return NextResponse.json(
        { error: 'Invalid contact ID' },
        { status: 400 }
      );
    }

    if (!body.updatedBy) {
      return NextResponse.json(
        { error: 'Missing required field: updatedBy' },
        { status: 400 }
      );
    }

    const existingContact = await db
      .select()
      .from(accountContact)
      .where(eq(accountContact.id, contactId))
      .limit(1);

    if (existingContact.length === 0) {
      return NextResponse.json(
        { error: 'Account contact not found' },
        { status: 404 }
      );
    }

    const updatedContact = await db
      .update(accountContact)
      .set({
        email: body.email,
        phoneNumber: body.phoneNumber,
        updatedBy: body.updatedBy,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(accountContact.id, contactId))
      .returning();

    return NextResponse.json(updatedContact[0]);
  } catch (error) {
    console.error('Error updating account contact:', error);
    return NextResponse.json(
      { error: 'Failed to update account contact' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const contactId = parseInt(id);

    if (isNaN(contactId)) {
      return NextResponse.json(
        { error: 'Invalid contact ID' },
        { status: 400 }
      );
    }

    const existingContact = await db
      .select()
      .from(accountContact)
      .where(eq(accountContact.id, contactId))
      .limit(1);

    if (existingContact.length === 0) {
      return NextResponse.json(
        { error: 'Account contact not found' },
        { status: 404 }
      );
    }

    await db.delete(accountContact).where(eq(accountContact.id, contactId));

    return NextResponse.json(
      { message: 'Account contact deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting account contact:', error);
    return NextResponse.json(
      { error: 'Failed to delete account contact' },
      { status: 500 }
    );
  }
}