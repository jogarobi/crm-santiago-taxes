import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { business, businessEntity, clientAccount } from '@/db/migrations/schema';
import { eq, desc, asc, like, or, and, count, isNotNull } from 'drizzle-orm';
import { requirePermission } from '@/lib/auth-utils';

export async function GET(request: Request) {
  try {
    await requirePermission({ business: ['read'] });
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const pageIndex = parseInt(searchParams.get('pageIndex') || '0');
    const sortBy = searchParams.get('sortBy');
    const sortDir = searchParams.get('sortDir') as 'asc' | 'desc' | null;
    const createdBy = searchParams.get('createdBy');

    // Build where conditions
    const conditions = [];

    if (search && search.trim()) {
      conditions.push(
        or(
          like(business.registeredName, `%${search.trim()}%`),
          like(business.ein, `%${search.trim()}%`),
          like(clientAccount.firstName, `%${search.trim()}%`),
          like(clientAccount.lastName, `%${search.trim()}%`)
        )
      );
    }

    if (createdBy) {
      conditions.push(eq(business.createdBy, createdBy));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get total count
    const totalResult = await db
      .select({ count: count() })
      .from(business)
      .leftJoin(clientAccount, eq(business.accountId, clientAccount.id))
      .where(whereClause);

    const total = totalResult[0]?.count || 0;

    // Get paginated businesses
    const businesses = await db
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
      .leftJoin(clientAccount, eq(business.accountId, clientAccount.id))
      .where(whereClause)
      .orderBy(
        sortBy === 'name'
          ? sortDir === 'desc'
            ? desc(business.registeredName)
            : asc(business.registeredName)
          : desc(business.createdAt)
      )
      .limit(pageSize)
      .offset(pageIndex * pageSize);

    return NextResponse.json({
      data: businesses,
      meta: {
        total,
        pageIndex,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error('Error fetching businesses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch businesses' },
      { status: 500 }
    );
  }
}
