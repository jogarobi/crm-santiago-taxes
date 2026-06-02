import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { clientAccount, business } from '@/db/migrations/schema';
import { or, like, eq, count, sql, asc, desc, gte, lte } from 'drizzle-orm';
import { requirePermission } from '@/lib/auth-utils';


export async function GET(request: Request) {
  try {
    await requirePermission({ client: ['read'] });
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const onlyWithSquareId = searchParams.get('onlyWithSquareId') === 'true';
    const accountType = searchParams.get('accountType') || 'all';
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const pageIndex = parseInt(searchParams.get('pageIndex') || '0');
    const sortBy = searchParams.get('sortBy');
    const sortDir = searchParams.get('sortDir') as 'asc' | 'desc' | null;
    const createdBy = searchParams.get('createdBy');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    const offset = pageIndex * pageSize;

    const conditions = [];

    if (search) {
      conditions.push(
        or(
          like(clientAccount.firstName, `%${search}%`),
          like(clientAccount.lastName, `%${search}%`),
          like(
            sql`${clientAccount.firstName} || ' ' || ${clientAccount.lastName}`,
            `%${search}%`
          ),
          like(clientAccount.ssnLastFour, `%${search}%`),
          eq(clientAccount.id, isNaN(parseInt(search)) ? -1 : parseInt(search)),
          sql`EXISTS (
            SELECT 1 FROM ${business}
            WHERE ${business.accountId} = CAST(${clientAccount.id} AS TEXT)
            AND ${business.registeredName} LIKE ${`%${search}%`}
          )`,
          sql`EXISTS (
            SELECT 1 FROM ClientAccountContact
            WHERE ClientAccountContact.accountId = "ClientAccount"."id"
            AND ClientAccountContact.contactValue LIKE ${`%${search}%`}
            AND LOWER(ClientAccountContact.contactType) LIKE '%phone%'
          )`
        )
      );
    }

    if (onlyWithSquareId) {
      conditions.push(sql`${clientAccount.squareId} IS NOT NULL`);
    }

    if (createdBy) {
      conditions.push(eq(clientAccount.createdBy, createdBy));
    }

    if (dateFrom) {
      conditions.push(gte(clientAccount.createdAt, dateFrom));
    }

    if (dateTo) {
      conditions.push(lte(clientAccount.createdAt, dateTo));
    }

    if (accountType === 'clients') {
      conditions.push(sql`NOT EXISTS (
        SELECT 1 FROM ${business}
        WHERE ${business.accountId} = CAST(${clientAccount.id} AS TEXT)
      )`);
    } else if (accountType === 'businesses') {
      conditions.push(sql`EXISTS (
        SELECT 1 FROM ${business}
        WHERE ${business.accountId} = CAST(${clientAccount.id} AS TEXT)
      )`);
    }

    const whereClause =
      conditions.length > 0 ? sql.join(conditions, sql` AND `) : undefined;

    const totalResult = await db
      .select({ count: count() })
      .from(clientAccount)
      .where(whereClause);

    const total = totalResult[0]?.count || 0;

    const dir = sortDir === 'desc' ? desc : asc;
    const orderBy =
      sortBy === 'name'
        ? [dir(clientAccount.firstName), dir(clientAccount.lastName)]
        : [asc(clientAccount.id)];

    const clientAccounts = await db
      .select({
        id: clientAccount.id,
        firstName: clientAccount.firstName,
        lastName: clientAccount.lastName,
        dateOfBirth: clientAccount.dateOfBirth,
        ssnLastFour: clientAccount.ssnLastFour,
        address: clientAccount.address,
        city: clientAccount.city,
        state: clientAccount.state,
        zipCode: clientAccount.zipCode,
        createdBy: clientAccount.createdBy,
        updatedAt: clientAccount.updatedAt,
        updatedBy: clientAccount.updatedBy,
        squareId: clientAccount.squareId,
        createdAt: clientAccount.createdAt,
        flag: clientAccount.flag,
        phoneNumber: sql<string | null>`(
          SELECT contactValue FROM ClientAccountContact
          WHERE ClientAccountContact.accountId = "ClientAccount"."id"
          AND LOWER(ClientAccountContact.contactType) LIKE '%phone%'
          ORDER BY ClientAccountContact.createdAt DESC
          LIMIT 1
        )`,
      })
      .from(clientAccount)
      .where(whereClause)
      .orderBy(...orderBy)
      .limit(pageSize)
      .offset(offset);

    // Fetch businesses for each account
    const accountsWithBusinesses = await Promise.all(
      clientAccounts.map(async (account) => {
        const accountBusinesses = await db
          .select({
            id: business.id,
            registeredName: business.registeredName,
          })
          .from(business)
          .where(eq(business.accountId, account.id.toString()));

        return {
          ...account,
          businesses: accountBusinesses,
        };
      })
    );

    return NextResponse.json({
      data: accountsWithBusinesses,
      meta: {
        total,
        pageSize,
        pageIndex,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error('Error fetching accounts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch accounts' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    await requirePermission({ client: ['create'] });

    const body = await request.json();

    if (
      !body.firstName ||
      !body.lastName ||
      !body.dateOfBirth ||
      !body.createdBy
    ) {
      return NextResponse.json(
        {
          error:
            'Missing required fields: firstName, lastName, dateOfBirth, createdBy',
        },
        { status: 400 }
      );
    }

    const newAccount = await db
      .insert(clientAccount)
      .values({
        firstName: body.firstName,
        lastName: body.lastName,
        dateOfBirth: body.dateOfBirth,
        ssnLastFour: body.ssnLastFour,
        address: body.address,
        city: body.city,
        state: body.state,
        zipCode: body.zipCode,
        createdBy: body.createdBy,
        createdAt: new Date().toISOString(),
        squareId: body.squareId,
      })
      .returning();

    return NextResponse.json(newAccount[0], { status: 201 });
  } catch (error) {
    console.error('Error creating account:', error);
    return NextResponse.json(
      { error: 'Failed to create account' },
      { status: 500 }
    );
  }
}
