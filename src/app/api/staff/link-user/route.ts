import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth-utils';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function POST(request: Request) {
  try {
    await requirePermission({ staff: ['update'] });

    const body = await request.json();

    if (!body.email || !body.userId) {
      return NextResponse.json(
        { error: 'Missing required fields: email, userId' },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from('Staff')
      .update({
        userId: body.userId,
        updatedAt: new Date().toISOString(),
      })
      .eq('email', body.email)
      .select();

    if (error) throw error;

    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: 'No staff member found with that email' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      staff: data[0],
    });
  } catch (error) {
    console.error('Error linking user to staff:', error);
    return NextResponse.json(
      { error: 'Failed to link user to staff member' },
      { status: 500 }
    );
  }
}
