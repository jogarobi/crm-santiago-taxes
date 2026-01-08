import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { businessEntity } from '@/db/migrations/schema';

export async function GET() {
  try {
    const entities = await db.select().from(businessEntity);

    return NextResponse.json(entities);
  } catch (error) {
    console.error('Error fetching business entities:', error);
    return NextResponse.json(
      { error: 'Failed to fetch business entities' },
      { status: 500 }
    );
  }
}
