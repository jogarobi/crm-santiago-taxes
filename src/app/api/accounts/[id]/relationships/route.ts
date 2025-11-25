import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { accountRelation, account } from '@/db/migrations/schema';
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

    const accountResult = await db
      .select()
      .from(account)
      .where(eq(account.id, accountId))
      .limit(1);

    if (accountResult.length === 0) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    const relationships = await db
      .select({
        id: accountRelation.id,
        accountId: accountRelation.accountId,
        relatedAccountId: accountRelation.relatedAccountId,
        relationship: accountRelation.relationship,
        createdAt: accountRelation.createdAt,
        createdBy: accountRelation.createdBy,
        updatedAt: accountRelation.updatedAt,
        updatedBy: accountRelation.updatedBy,
        relatedAccount: {
          id: account.id,
          firstName: account.firstName,
          lastName: account.lastName,
          dateOfBirth: account.dateOfBirth,
        },
      })
      .from(accountRelation)
      .leftJoin(account, eq(accountRelation.relatedAccountId, account.id))
      .where(eq(accountRelation.accountId, accountId));

    console.log(relationships);

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
    const { id } = await params;
    const accountId = parseInt(id);
    const body = await request.json();

    if (isNaN(accountId)) {
      return NextResponse.json(
        { error: 'Invalid account ID' },
        { status: 400 }
      );
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

    // Check if account exists
    const accountResult = await db
      .select()
      .from(account)
      .where(eq(account.id, accountId))
      .limit(1);

    if (accountResult.length === 0) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    // Check if related account exists
    const relatedAccountResult = await db
      .select()
      .from(account)
      .where(eq(account.id, body.relatedAccountId))
      .limit(1);

    if (relatedAccountResult.length === 0) {
      return NextResponse.json(
        { error: 'Related account not found' },
        { status: 404 }
      );
    }

    const newRelationship = await db
      .insert(accountRelation)
      .values({
        accountId,
        relatedAccountId: body.relatedAccountId,
        relationship: body.relationship,
        createdBy: body.createdBy,
        createdAt: new Date().toISOString(),
      })
      .returning();

    return NextResponse.json(newRelationship[0], { status: 201 });
  } catch (error) {
    console.error('Error creating account relationship:', error);
    return NextResponse.json(
      { error: 'Failed to create account relationship' },
      { status: 500 }
    );
  }
}
