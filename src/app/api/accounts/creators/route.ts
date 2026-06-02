import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { clientAccount } from '@/db/migrations/schema';
import { isNotNull } from 'drizzle-orm';
import { requirePermission } from '@/lib/auth-utils';

export async function GET() {
  try {
    await requirePermission({ client: ['read'] });

    const results = await db
      .selectDistinct({ createdBy: clientAccount.createdBy })
      .from(clientAccount)
      .where(isNotNull(clientAccount.createdBy));

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
