import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { business, businessAccount, businessEntity, clientAccount } from '@/db/migrations/schema';
import { eq, and, sql } from 'drizzle-orm';
import { requirePermission } from '@/lib/auth-utils';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; businessId: string }> }
) {
  try {
    await requirePermission({ business: ['read'] });

    const { id, businessId } = await params;
    const accountId = parseInt(id);
    const businessIdInt = parseInt(businessId);

    if (isNaN(accountId) || isNaN(businessIdInt)) {
      return NextResponse.json(
        { error: 'Invalid account ID or business ID' },
        { status: 400 }
      );
    }

    // Fetch business with entity and account information
    const result = await db
      .select({
        id: business.id,
        accountId: business.accountId,
        registeredName: business.registeredName,
        establishedDate: business.establishedDate,
        ein: business.ein,
        address: business.address,
        city: business.city,
        state: business.state,
        zipCode: business.zipCode,
        createdAt: business.createdAt,
        createdBy: business.createdBy,
        updatedAt: business.updatedAt,
        updatedBy: business.updatedBy,
        entityId: business.entityId,
        entity: {
          id: businessEntity.id,
          name: businessEntity.name,
        },
        account: {
          id: clientAccount.id,
          firstName: clientAccount.firstName,
          lastName: clientAccount.lastName,
        },
      })
      .from(business)
      .leftJoin(businessEntity, eq(business.entityId, businessEntity.id))
      .leftJoin(clientAccount, sql`CAST(${business.accountId} AS INTEGER) = ${clientAccount.id}`)
      .where(
        and(
          eq(business.id, businessIdInt),
          eq(business.accountId, accountId.toString())
        )
      )
      .limit(1);

    if (result.length === 0) {
      return NextResponse.json(
        { error: 'Business not found' },
        { status: 404 }
      );
    }

    // Fetch all associated accounts from junction table
    const associatedAccounts = await db
      .select({
        id: clientAccount.id,
        firstName: clientAccount.firstName,
        lastName: clientAccount.lastName,
      })
      .from(businessAccount)
      .innerJoin(clientAccount, eq(businessAccount.accountId, clientAccount.id))
      .where(eq(businessAccount.businessId, businessIdInt));

    return NextResponse.json({ ...result[0], accounts: associatedAccounts });
  } catch (error) {
    console.error('Error fetching business:', error);
    return NextResponse.json(
      { error: 'Failed to fetch business' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string; businessId: string }> }
) {
  try {
    await requirePermission({ business: ['update'] });

    const { id, businessId } = await params;
    const accountId = parseInt(id);
    const businessIdInt = parseInt(businessId);
    const body = await request.json();

    if (isNaN(accountId) || isNaN(businessIdInt)) {
      return NextResponse.json(
        { error: 'Invalid account ID or business ID' },
        { status: 400 }
      );
    }

    // Check if business exists and belongs to this account
    const existingBusiness = await db
      .select()
      .from(business)
      .where(
        and(
          eq(business.id, businessIdInt),
          eq(business.accountId, accountId.toString())
        )
      )
      .limit(1);

    if (existingBusiness.length === 0) {
      return NextResponse.json(
        { error: 'Business not found' },
        { status: 404 }
      );
    }

    const updatedBusiness = await db
      .update(business)
      .set({
        registeredName: body.registeredName,
        establishedDate: body.establishedDate || null,
        ein: body.ein || null,
        address: body.address || null,
        city: body.city || null,
        state: body.state || null,
        zipCode: body.zipCode || null,
        entityId: body.entityId || null,
        updatedBy: body.updatedBy,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(business.id, businessIdInt))
      .returning();

    return NextResponse.json(updatedBusiness[0]);
  } catch (error) {
    console.error('Error updating business:', error);
    return NextResponse.json(
      { error: 'Failed to update business' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; businessId: string }> }
) {
  try {
    await requirePermission({ business: ['delete'] });

    const { id, businessId } = await params;
    const accountId = parseInt(id);
    const businessIdInt = parseInt(businessId);

    if (isNaN(accountId) || isNaN(businessIdInt)) {
      return NextResponse.json(
        { error: 'Invalid account ID or business ID' },
        { status: 400 }
      );
    }

    // Check if business exists and belongs to this account
    const existingBusiness = await db
      .select()
      .from(business)
      .where(
        and(
          eq(business.id, businessIdInt),
          eq(business.accountId, accountId.toString())
        )
      )
      .limit(1);

    if (existingBusiness.length === 0) {
      return NextResponse.json(
        { error: 'Business not found' },
        { status: 404 }
      );
    }

    await db.delete(business).where(eq(business.id, businessIdInt));

    return NextResponse.json({ message: 'Business deleted successfully' });
  } catch (error) {
    console.error('Error deleting business:', error);
    return NextResponse.json(
      { error: 'Failed to delete business' },
      { status: 500 }
    );
  }
}
