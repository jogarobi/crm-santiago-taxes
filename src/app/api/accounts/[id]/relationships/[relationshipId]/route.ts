import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { clientAccountRelation, clientAccount } from '@/db/migrations/schema';
import { eq } from 'drizzle-orm';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; relationshipId: string }> }
) {
  try {
    const { id, relationshipId } = await params;
    const accountId = parseInt(id);
    const relationshipIdInt = parseInt(relationshipId);

    if (isNaN(accountId) || isNaN(relationshipIdInt)) {
      return NextResponse.json(
        { error: 'Invalid account ID or relationship ID' },
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

    const result = await db
      .select()
      .from(clientAccountRelation)
      .where(eq(clientAccountRelation.id, relationshipIdInt))
      .limit(1);

    if (result.length === 0) {
      return NextResponse.json(
        { error: 'Account relationship not found' },
        { status: 404 }
      );
    }

    // Verify the relationship belongs to this account
    if (result[0].accountId !== accountId) {
      return NextResponse.json(
        { error: 'Relationship does not belong to this account' },
        { status: 403 }
      );
    }

    return NextResponse.json(result[0]);
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

    // Check if account exists
    const accountResult = await db
      .select()
      .from(clientAccount)
      .where(eq(clientAccount.id, accountId))
      .limit(1);

    if (accountResult.length === 0) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    const existingRelationship = await db
      .select()
      .from(clientAccountRelation)
      .where(eq(clientAccountRelation.id, relationshipIdInt))
      .limit(1);

    if (existingRelationship.length === 0) {
      return NextResponse.json(
        { error: 'Account relationship not found' },
        { status: 404 }
      );
    }

    // Verify the relationship belongs to this account
    if (existingRelationship[0].accountId !== accountId) {
      return NextResponse.json(
        { error: 'Relationship does not belong to this account' },
        { status: 403 }
      );
    }

    const updatedRelationship = await db
      .update(clientAccountRelation)
      .set({
        relatedAccountId: body.relatedAccountId,
        relationship: body.relationship,
        updatedBy: body.updatedBy,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(clientAccountRelation.id, relationshipIdInt))
      .returning();

    return NextResponse.json(updatedRelationship[0]);
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
    const { id, relationshipId } = await params;
    const accountId = parseInt(id);
    const relationshipIdInt = parseInt(relationshipId);

    if (isNaN(accountId) || isNaN(relationshipIdInt)) {
      return NextResponse.json(
        { error: 'Invalid account ID or relationship ID' },
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

    const existingRelationship = await db
      .select()
      .from(clientAccountRelation)
      .where(eq(clientAccountRelation.id, relationshipIdInt))
      .limit(1);

    if (existingRelationship.length === 0) {
      return NextResponse.json(
        { error: 'Account relationship not found' },
        { status: 404 }
      );
    }

    // Verify the relationship belongs to this account
    if (existingRelationship[0].accountId !== accountId) {
      return NextResponse.json(
        { error: 'Relationship does not belong to this account' },
        { status: 403 }
      );
    }

    await db
      .delete(clientAccountRelation)
      .where(eq(clientAccountRelation.id, relationshipIdInt));

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
