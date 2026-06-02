import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { business, businessAccount } from '@/db/migrations/schema';
import { eq, and, ne } from 'drizzle-orm';
import { requirePermission } from '@/lib/auth-utils';

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ businessId: string; accountId: string }> }
) {
  try {
    await requirePermission({ business: ['update'] });

    const { businessId, accountId } = await params;
    const businessIdInt = parseInt(businessId);
    const accountIdInt = parseInt(accountId);

    if (isNaN(businessIdInt) || isNaN(accountIdInt)) {
      return NextResponse.json(
        { error: 'Invalid business ID or account ID' },
        { status: 400 }
      );
    }

    const businessRecord = await db
      .select({ id: business.id, accountId: business.accountId })
      .from(business)
      .where(eq(business.id, businessIdInt))
      .limit(1);

    if (businessRecord.length === 0) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    const link = await db
      .select({ id: businessAccount.id })
      .from(businessAccount)
      .where(
        and(
          eq(businessAccount.businessId, businessIdInt),
          eq(businessAccount.accountId, accountIdInt)
        )
      )
      .limit(1);

    if (link.length === 0) {
      return NextResponse.json(
        { error: 'Account is not associated with this business' },
        { status: 404 }
      );
    }

    const isPrimary = parseInt(businessRecord[0].accountId) === accountIdInt;

    if (isPrimary) {
      // Find another linked account to promote to primary
      const nextAccount = await db
        .select({ accountId: businessAccount.accountId })
        .from(businessAccount)
        .where(
          and(
            eq(businessAccount.businessId, businessIdInt),
            ne(businessAccount.accountId, accountIdInt)
          )
        )
        .limit(1);

      if (nextAccount.length === 0) {
        return NextResponse.json(
          { error: 'Cannot remove the only person linked to this business' },
          { status: 400 }
        );
      }

      // Promote the next account to primary owner
      await db
        .update(business)
        .set({ accountId: nextAccount[0].accountId.toString() })
        .where(eq(business.id, businessIdInt));
    }

    await db
      .delete(businessAccount)
      .where(
        and(
          eq(businessAccount.businessId, businessIdInt),
          eq(businessAccount.accountId, accountIdInt)
        )
      );

    return NextResponse.json({ message: 'Account removed from business successfully' });
  } catch (error) {
    console.error('Error removing account from business:', error);
    return NextResponse.json(
      { error: 'Failed to remove account from business' },
      { status: 500 }
    );
  }
}
