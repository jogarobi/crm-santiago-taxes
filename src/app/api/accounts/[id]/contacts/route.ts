import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { accountContact, account } from '@/db/migrations/schema';
import { eq } from 'drizzle-orm';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
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
      .from(account)
      .where(eq(account.id, accountId))
      .limit(1);

    if (accountResult.length === 0) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    // Get contacts for the account
    const contacts = await db
      .select()
      .from(accountContact)
      .where(eq(accountContact.accountId, accountId));

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
    const { id } = await params;
    const accountId = parseInt(id);
    const body = await request.json();

    if (isNaN(accountId)) {
      return NextResponse.json(
        { error: 'Invalid account ID' },
        { status: 400 }
      );
    }

    if (!body.createdBy) {
      return NextResponse.json(
        { error: 'Missing required field: createdBy' },
        { status: 400 }
      );
    }

    // Check if account exists
    const accountResult = await db
      .select()
      .from(account)
      .where(eq(account.id, accountId))
      .limit(1);

    if (accountResult.length === 0) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    const newContact = await db
      .insert(accountContact)
      .values({
        accountId,
        email: body.email,
        phoneNumber: body.phoneNumber,
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