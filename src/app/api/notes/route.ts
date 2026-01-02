import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { note } from '@/db/migrations/schema';
import { eq, desc, like, and, count } from 'drizzle-orm';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get('accountId');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!accountId) {
      return NextResponse.json(
        { error: 'accountId query parameter is required' },
        { status: 400 }
      );
    }

    const accountIdInt = parseInt(accountId);

    if (isNaN(accountIdInt)) {
      return NextResponse.json(
        { error: 'Invalid account ID' },
        { status: 400 }
      );
    }

    // Build where conditions
    const conditions = [eq(note.accountId, accountIdInt)];

    if (search && search.trim()) {
      conditions.push(like(note.content, `%${search.trim()}%`));
    }

    const whereClause =
      conditions.length > 1 ? and(...conditions) : conditions[0];

    // Get total count
    const totalResult = await db
      .select({ count: count() })
      .from(note)
      .where(whereClause);

    const total = totalResult[0]?.count || 0;

    // Get paginated notes
    const notes = await db
      .select()
      .from(note)
      .where(whereClause)
      .orderBy(desc(note.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({
      success: true,
      notes,
      count: notes.length,
      total,
      hasMore: offset + notes.length < total,
    });
  } catch (error) {
    console.error('Error fetching notes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notes' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body.accountId || !body.content || !body.createdBy) {
      return NextResponse.json(
        { error: 'Missing required fields: accountId, content, createdBy' },
        { status: 400 }
      );
    }

    const accountIdInt = parseInt(body.accountId);

    if (isNaN(accountIdInt)) {
      return NextResponse.json(
        { error: 'Invalid account ID' },
        { status: 400 }
      );
    }

    const newNote = await db
      .insert(note)
      .values({
        accountId: accountIdInt,
        content: body.content,
        createdBy: body.createdBy,
        createdAt: new Date().toISOString(),
      })
      .returning();

    return NextResponse.json(newNote[0], { status: 201 });
  } catch (error) {
    console.error('Error creating note:', error);
    return NextResponse.json(
      { error: 'Failed to create note' },
      { status: 500 }
    );
  }
}
