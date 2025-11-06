import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { account } from '@/db/schema';
import { or, like, eq } from 'drizzle-orm';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');

    if (!search) {
      const accounts = await db.select().from(account);
      return NextResponse.json(accounts);
    }

    // SQLite's LIKE is case-insensitive by default
    const searchTerm = `%${search}%`;
    const accounts = await db
      .select()
      .from(account)
      .where(
        or(
          like(account.firstName, searchTerm),
          like(account.lastName, searchTerm),
          like(account.ssnLastFour, searchTerm),
          eq(account.id, isNaN(parseInt(search)) ? -1 : parseInt(search))
        )
      );

    return NextResponse.json(accounts);
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
