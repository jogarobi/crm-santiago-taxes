import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth-utils';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function GET() {
  try {
    await requirePermission({ client: ['read'] });

    const { count, error } = await supabaseAdmin
      .from('Clients')
      .select('id', { count: 'exact', head: true });

    if (error) throw error;

    return NextResponse.json({
      success: true,
      count: count ?? 0,
    });
  } catch (error) {
    console.error('Error fetching client count:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch client count',
      },
      { status: 500 }
    );
  }
}
