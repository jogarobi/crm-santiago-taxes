import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { clientAccount } from '@/db/migrations/schema';
import { or, like, eq, count, sql } from 'drizzle-orm';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const onlyWithSquareId = searchParams.get('onlyWithSquareId') === 'true';
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const pageIndex = parseInt(searchParams.get('pageIndex') || '0');

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
          eq(clientAccount.id, isNaN(parseInt(search)) ? -1 : parseInt(search))
        )
      );
    }

    if (onlyWithSquareId) {
      conditions.push(sql`${clientAccount.squareId} IS NOT NULL`);
    }

    const whereClause =
      conditions.length > 0 ? sql.join(conditions, sql` AND `) : undefined;

    const totalResult = await db
      .select({ count: count() })
      .from(clientAccount)
      .where(whereClause);

    const total = totalResult[0]?.count || 0;

    const clientAccounts = await db
      .select()
      .from(clientAccount)
      .where(whereClause)
      .limit(pageSize)
      .offset(offset);

    return NextResponse.json({
      data: clientAccounts,
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
