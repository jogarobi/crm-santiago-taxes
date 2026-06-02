import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { clientAccountContact, clientAccount } from '@/db/migrations/schema';
import { eq } from 'drizzle-orm';
import { requirePermission } from '@/lib/auth-utils';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requirePermission({ client: ['read'] });

    const { id } = await params;
    const accountId = parseInt(id);

    if (isNaN(accountId)) {
      return NextResponse.json(
        { error: 'Invalid account ID' },
        { status: 400 }
      );
    }

    // Check if account exists
    const accountResult = await db
      .select()
      .from(clientAccount)
      .where(eq(clientAccount.id, accountId))
      .limit(1);

    if (accountResult.length === 0) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    // Get contacts for the account
    const contacts = await db
      .select()
      .from(clientAccountContact)
      .where(eq(clientAccountContact.accountId, accountId));

    return NextResponse.json(contacts);
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
      return NextResponse.json(
        { error: 'Invalid account ID' },
        { status: 400 }
      );
    }

    if (!body.createdBy || !body.contactType || !body.contactValue) {
      return NextResponse.json(
        { error: 'Missing required fields: contactType, contactValue, createdBy' },
        { status: 400 }
      );
    }

    if (!['email', 'phone'].includes(body.contactType)) {
      return NextResponse.json(
        { error: 'contactType must be "email" or "phone"' },
        { status: 400 }
      );
    }

    // Check if account exists
    const accountResult = await db
      .select()
      .from(clientAccount)
      .where(eq(clientAccount.id, accountId))
      .limit(1);

    if (accountResult.length === 0) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    const newContact = await db
      .insert(clientAccountContact)
      .values({
        accountId,
        contactType: body.contactType,
        contactValue: body.contactValue,
        createdBy: body.createdBy,
        createdAt: new Date().toISOString(),
      })
      .returning();

    return NextResponse.json(newContact[0], { status: 201 });
  } catch (error) {
    console.error('Error creating account contact:', error);
    return NextResponse.json(
      { error: 'Failed to create account contact' },
      { status: 500 }
    );
  }
}
