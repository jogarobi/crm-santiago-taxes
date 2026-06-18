import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth-utils';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function GET() {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { data, error } = await supabaseAdmin
      .from('Staff')
      .select('*')
      .eq('userId', session.user.id)
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      return NextResponse.json(
        { error: 'Staff record not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching current staff:', error);
    return NextResponse.json(
      { error: 'Failed to fetch staff record' },
      { status: 500 }
    );
  }
}
