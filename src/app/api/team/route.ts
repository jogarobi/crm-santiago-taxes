import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('Staff')
      .select('*')
      .eq('status', 'active');

    if (error) throw error;

    const teamMembers = (data ?? [])
      .filter((member) => member.squareId)
      .map((member) => ({
        id: member.squareId,
        givenName: member.firstName,
        familyName: member.lastName,
        status: member.status,
      }));

    return NextResponse.json({
      success: true,
      teamMembers,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch staff members',
        message:
          error instanceof Error
            ? error.message
            : 'Internal server error occurred',
      },
      { status: 500 }
    );
  }
}
