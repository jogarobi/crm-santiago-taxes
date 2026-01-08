import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { business } from '@/db/migrations/schema';
import { eq, and } from 'drizzle-orm';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string; businessId: string }> }
) {
  try {
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
