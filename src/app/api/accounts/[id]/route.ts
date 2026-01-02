import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { clientAccount } from '@/db/migrations/schema';
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

    const result = await db
      .select()
      .from(account)
      .where(eq(account.id, accountId))
      .limit(1);

    if (result.length === 0) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error('Error fetching account:', error);
    return NextResponse.json(
      { error: 'Failed to fetch account' },
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
    const accountId = parseInt(id);
    const body = await request.json();

    if (isNaN(accountId)) {
      return NextResponse.json(
        { error: 'Invalid account ID' },
        { status: 400 }
      );
    }

    const existingAccount = await db
      .select()
      .from(account)
      .where(eq(account.id, accountId))
      .limit(1);

    if (existingAccount.length === 0) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    const updatedAccount = await db
      .update(account)
      .set({
        firstName: body.firstName,
        lastName: body.lastName,
        dateOfBirth: body.dateOfBirth,
        ssnLastFour: body.ssnLastFour,
        address: body.address,
        city: body.city,
        state: body.state,
        zipCode: body.zipCode,
        updatedBy: body.updatedBy,
        updatedAt: new Date().toISOString(),
        squareId: body.squareId,
      })
      .where(eq(account.id, accountId))
      .returning();

    return NextResponse.json(updatedAccount[0]);
  } catch (error) {
    console.error('Error updating account:', error);
    return NextResponse.json(
      { error: 'Failed to update account' },
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
    const accountId = parseInt(id);

    if (isNaN(accountId)) {
      return NextResponse.json(
        { error: 'Invalid account ID' },
        { status: 400 }
      );
    }

    const existingAccount = await db
      .select()
      .from(account)
      .where(eq(account.id, accountId))
      .limit(1);

    if (existingAccount.length === 0) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    await db.delete(account).where(eq(account.id, accountId));

    return NextResponse.json(
      { message: 'Account deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting account:', error);
    return NextResponse.json(
      { error: 'Failed to delete account' },
      { status: 500 }
    );
  }
}
