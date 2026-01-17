import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { note } from '@/db/migrations/schema';
import { eq, desc, like, and, count } from 'drizzle-orm';
import { requirePermission } from '@/lib/auth-utils';

export async function GET(request: Request) {
  try {
    await requirePermission({ note: ['read'] });
    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get('accountId');
    const businessId = searchParams.get('businessId');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!accountId && !businessId) {
      return NextResponse.json(
        { error: 'Either accountId or businessId query parameter is required' },
        { status: 400 },
      );
    }

    const conditions = [];

    if (accountId) {
      const accountIdInt = parseInt(accountId);
      if (isNaN(accountIdInt)) {
        return NextResponse.json(
          { error: 'Invalid account ID' },
          { status: 400 },
        );
      }
      conditions.push(eq(note.accountId, accountIdInt));
    }

    if (businessId) {
      const businessIdInt = parseInt(businessId);
      if (isNaN(businessIdInt)) {
        return NextResponse.json(
          { error: 'Invalid business ID' },
          { status: 400 },
        );
      }
      conditions.push(eq(note.businessId, businessIdInt));
    }

    if (search && search.trim()) {
      conditions.push(like(note.content, `%${search.trim()}%`));
    }

    const whereClause =
      conditions.length > 1 ? and(...conditions) : conditions[0];

    const totalResult = await db
      .select({ count: count() })
      .from(note)
      .where(whereClause);

    const total = totalResult[0]?.count || 0;

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
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    await requirePermission({ note: ['create'] });

    const body = await request.json();

    if (!body.content || !body.createdBy) {
      return NextResponse.json(
        { error: 'Missing required fields: content, createdBy' },
        { status: 400 },
      );
    }

    if (!body.accountId && !body.businessId) {
      return NextResponse.json(
        { error: 'Either accountId or businessId is required' },
        { status: 400 },
      );
    }

    const accountIdInt = body.accountId ? parseInt(body.accountId) : null;
    const businessIdInt = body.businessId ? parseInt(body.businessId) : null;

    if (body.accountId && isNaN(Number(accountIdInt))) {
      return NextResponse.json(
        { error: 'Invalid account ID' },
        { status: 400 },
      );
    }

    if (body.businessId && isNaN(Number(businessIdInt))) {
      return NextResponse.json(
        { error: 'Invalid business ID' },
        { status: 400 },
      );
    }

    const newNote = await db
      .insert(note)
      .values({
        accountId: accountIdInt,
        businessId: businessIdInt,
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
      { status: 500 },
    );
  }
}
