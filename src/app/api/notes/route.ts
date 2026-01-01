import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { note } from '@/db/migrations/schema';
import { eq, desc } from 'drizzle-orm';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get('accountId');

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

    const notes = await db
      .select()
      .from(note)
      .where(eq(note.accountId, accountIdInt))
      .orderBy(desc(note.createdAt));

    return NextResponse.json({
      success: true,
      notes,
      count: notes.length,
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
