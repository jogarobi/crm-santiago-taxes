import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { business, businessEntity, clientAccount } from '@/db/migrations/schema';
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
      .from(clientAccount)
      .where(eq(clientAccount.id, accountId))
      .limit(1);

    if (accountResult.length === 0) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    const businesses = await db
      .select({
        id: business.id,
        accountId: business.accountId,
        registeredName: business.registeredName,
        establishedDate: business.establishedDate,
        ein: business.ein,
        createdAt: business.createdAt,
        createdBy: business.createdBy,
        updatedAt: business.updatedAt,
        updatedBy: business.updatedBy,
        address: business.address,
        city: business.city,
        state: business.state,
        zipCode: business.zipCode,
        entityId: business.entityId,
        entity: {
          id: businessEntity.id,
          name: businessEntity.name,
        },
      })
      .from(business)
      .leftJoin(businessEntity, eq(business.entityId, businessEntity.id))
      .where(eq(business.accountId, accountId.toString()));

    return NextResponse.json(businesses);
  } catch (error) {
    console.error('Error fetching businesses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch businesses' },
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

    if (!body.registeredName || !body.createdBy) {
      return NextResponse.json(
        {
          error: 'Missing required fields: registeredName, createdBy',
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

    const newBusiness = await db
      .insert(business)
      .values({
        accountId: accountId.toString(),
        registeredName: body.registeredName,
        establishedDate: body.establishedDate || null,
        ein: body.ein || null,
        address: body.address || null,
        city: body.city || null,
        state: body.state || null,
        zipCode: body.zipCode || null,
        entityId: body.entityId || null,
        createdBy: body.createdBy,
        createdAt: new Date().toISOString(),
      })
      .returning();

    return NextResponse.json(newBusiness[0], { status: 201 });
  } catch (error) {
    console.error('Error creating business:', error);
    return NextResponse.json(
      { error: 'Failed to create business' },
      { status: 500 }
    );
  }
}
