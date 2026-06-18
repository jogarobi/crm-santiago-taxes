import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth-utils';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function GET() {
  try {
    await requirePermission({ business: ['read'] });

    const { data, error } = await supabaseAdmin
      .from('Businesses')
      .select('createdBy')
      .not('createdBy', 'is', null);

    if (error) throw error;

    const creators = Array.from(
      new Set((data ?? []).map((r) => r.createdBy).filter(Boolean))
    ).sort() as string[];

    return NextResponse.json({ creators });
  } catch (error) {
    console.error('Error fetching creators:', error);
    return NextResponse.json(
      { error: 'Failed to fetch creators' },
      { status: 500 }
    );
  }
}
