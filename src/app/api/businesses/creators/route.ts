import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { business } from '@/db/migrations/schema';
import { isNotNull } from 'drizzle-orm';
import { requirePermission } from '@/lib/auth-utils';

export async function GET() {
  try {
    await requirePermission({ business: ['read'] });

    const results = await db
      .selectDistinct({ createdBy: business.createdBy })
      .from(business)
      .where(isNotNull(business.createdBy));

    const creators = results
      .map((r) => r.createdBy)
      .filter(Boolean)
      .sort() as string[];

    return NextResponse.json({ creators });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch creators' },
      { status: 500 }
    );
  }
}
