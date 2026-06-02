import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { clientAccountRelation, clientAccount } from '@/db/migrations/schema';
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

    const accountResult = await db
      .select()
      .from(clientAccount)
      .where(eq(clientAccount.id, accountId))
      .limit(1);

    if (accountResult.length === 0) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    const selectShape = {
      id: clientAccountRelation.id,
      accountId: clientAccountRelation.accountId,
      relatedAccountId: clientAccountRelation.relatedAccountId,
      relationship: clientAccountRelation.relationship,
      createdAt: clientAccountRelation.createdAt,
      createdBy: clientAccountRelation.createdBy,
      updatedAt: clientAccountRelation.updatedAt,
      updatedBy: clientAccountRelation.updatedBy,
      relatedAccount: {
        id: clientAccount.id,
        firstName: clientAccount.firstName,
        lastName: clientAccount.lastName,
        dateOfBirth: clientAccount.dateOfBirth,
      },
    };

    // Relationships where this account is the primary (accountId = X)
    const direct = await db
      .select(selectShape)
      .from(clientAccountRelation)
      .leftJoin(clientAccount, eq(clientAccountRelation.relatedAccountId, clientAccount.id))
      .where(eq(clientAccountRelation.accountId, accountId));

    // Relationships where this account is the related side (relatedAccountId = X)
    // Join on accountId to get the OTHER account's info for display
    const inverse = await db
      .select(selectShape)
      .from(clientAccountRelation)
      .leftJoin(clientAccount, eq(clientAccountRelation.accountId, clientAccount.id))
      .where(eq(clientAccountRelation.relatedAccountId, accountId));

    const relationships = [
      ...direct.map((r) => ({ ...r, ownerAccountId: r.accountId! })),
      ...inverse.map((r) => ({ ...r, ownerAccountId: r.accountId! })),
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
      .from(clientAccount)
      .where(eq(clientAccount.id, accountId))
      .limit(1);

    if (accountResult.length === 0) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    // Check if related account exists
    const relatedAccountResult = await db
      .select()
      .from(clientAccount)
      .where(eq(clientAccount.id, body.relatedAccountId))
      .limit(1);

    if (relatedAccountResult.length === 0) {
      return NextResponse.json(
        { error: 'Related account not found' },
        { status: 404 }
      );
    }

    const newRelationship = await db
      .insert(clientAccountRelation)
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
