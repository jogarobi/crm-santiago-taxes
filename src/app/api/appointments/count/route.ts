import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth-utils';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function GET() {
  try {
    await requirePermission({ appointment: ['read'] });

    const { count, error } = await supabaseAdmin
      .from('Appointments')
      .select('id', { count: 'exact', head: true });

    if (error) throw error;

    return NextResponse.json({
      success: true,
      count: count ?? 0,
    });
  } catch (error) {
    console.error('Error fetching appointment count:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch appointment count',
      },
      { status: 500 }
    );
  }
}
