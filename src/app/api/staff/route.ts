import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { staff } from '@/db/migrations/schema';
import { like, or, desc, sql } from 'drizzle-orm';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const pageIndex = parseInt(searchParams.get('pageIndex') || '0');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');

    // Build where conditions
    const whereConditions = [];

    if (search) {
      whereConditions.push(
        or(
          like(staff.firstName, `%${search}%`),
          like(staff.lastName, `%${search}%`),
          like(staff.title, `%${search}%`),
          like(sql`CAST(${staff.id} AS TEXT)`, `%${search}%`)
        )
      );
    }

    // Get total count
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(staff)
      .where(whereConditions.length > 0 ? or(...whereConditions) : undefined);

    const total = Number(countResult[0]?.count || 0);

    // Get paginated staff
    const staffMembers = await db
      .select()
      .from(staff)
      .where(whereConditions.length > 0 ? or(...whereConditions) : undefined)
      .orderBy(desc(staff.createdAt))
      .limit(pageSize)
      .offset(pageIndex * pageSize);

    const totalPages = Math.ceil(total / pageSize);

    return NextResponse.json({
      data: staffMembers,
      meta: {
        total,
        pageIndex,
        pageSize,
        totalPages,
      },
    });
  } catch (error) {
    console.error('Error fetching staff:', error);
    return NextResponse.json(
      { error: 'Failed to fetch staff members' },
      { status: 500 }
    );
  }
}
