import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-utils';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { role } = await requireAuth();

    // Only owner and admin may change a staff member's password.
    if (role !== 'owner' && role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id: idString } = await params;
    const id = parseInt(idString);
    const body = await request.json();

    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid staff ID' }, { status: 400 });
    }

    if (!body.password || typeof body.password !== 'string') {
      return NextResponse.json(
        { error: 'Missing required field: password' },
        { status: 400 }
      );
    }

    if (body.password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    const { data: staffMember, error: fetchError } = await supabaseAdmin
      .from('Staff')
      .select('userId')
      .eq('id', id)
      .maybeSingle();

    if (fetchError) throw fetchError;

    if (!staffMember) {
      return NextResponse.json(
        { error: 'Staff member not found' },
        { status: 404 }
      );
    }

    if (!staffMember.userId) {
      return NextResponse.json(
        { error: 'This staff member has no linked user account' },
        { status: 400 }
      );
    }

    const { error: updateError } =
      await supabaseAdmin.auth.admin.updateUserById(staffMember.userId, {
        password: body.password,
      });

    if (updateError) throw updateError;

    return NextResponse.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Error changing staff password:', error);
    return NextResponse.json(
      { error: 'Failed to change password' },
      { status: 500 }
    );
  }
}
