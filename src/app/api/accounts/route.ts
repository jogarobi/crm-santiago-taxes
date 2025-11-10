import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { account } from '@/db/migrations/schema';
import { or, like, eq, count } from 'drizzle-orm';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const pageIndex = parseInt(searchParams.get('pageIndex') || '0');

    // Calculate offset
    const offset = pageIndex * pageSize;

    // Build where clause if search exists
    const whereClause = search
      ? or(
          like(account.firstName, `%${search}%`),
          like(account.lastName, `%${search}%`),
          like(account.ssnLastFour, `%${search}%`),
          eq(account.id, isNaN(parseInt(search)) ? -1 : parseInt(search))
        )
      : undefined;

    // Get total count
    const totalResult = await db
      .select({ count: count() })
      .from(account)
      .where(whereClause);

    const total = totalResult[0]?.count || 0;

    // Get paginated data
    const accounts = await db
      .select()
      .from(account)
      .where(whereClause)
      .limit(pageSize)
      .offset(offset);

    return NextResponse.json({
      data: accounts,
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
      .insert(account)
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
