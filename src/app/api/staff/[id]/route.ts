import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth-utils';
import { supabaseAdmin } from '@/lib/supabase/admin';
import type { Database } from '@/db/db.types';

type StaffUpdate = Database['public']['Tables']['Staff']['Update'];

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requirePermission({ staff: ['update'] });

    const { id: idString } = await params;
    const id = parseInt(idString);
    const body = await request.json();

    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid staff ID' }, { status: 400 });
    }

    if (!body.updatedBy) {
      return NextResponse.json(
        { error: 'Missing required field: updatedBy' },
        { status: 400 }
      );
    }

    const updateData: StaffUpdate = {
      updatedAt: new Date().toISOString(),
      updatedBy: body.updatedBy,
    };

    if (body.firstName !== undefined) updateData.firstName = body.firstName;
    if (body.lastName !== undefined) updateData.lastName = body.lastName;
    if (body.title !== undefined) updateData.title = body.title;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.email !== undefined) updateData.email = body.email || null;
    if (body.squareId !== undefined)
      updateData.squareId = body.squareId || null;

    const { data: updated, error } = await supabaseAdmin
      .from('Staff')
      .update(updateData)
      .eq('id', id)
      .select()
      .maybeSingle();

    if (error) throw error;

    if (!updated) {
      return NextResponse.json(
        { error: 'Staff member not found' },
        { status: 404 }
      );
    }

    // Update the role in the linked auth user's metadata if provided.
    if (body.role !== undefined && updated.userId) {
      const { error: roleError } = await supabaseAdmin.auth.admin.updateUserById(
        updated.userId,
        { app_metadata: { role: body.role } }
      );
      if (roleError) {
        console.error('Failed to update user role:', roleError);
      }
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating staff member:', error);
    return NextResponse.json(
      { error: 'Failed to update staff member' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requirePermission({ staff: ['delete'] });

    const { id: idString } = await params;
    const id = parseInt(idString);

    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid staff ID' }, { status: 400 });
    }

    const { data: staffMember, error: fetchError } = await supabaseAdmin
      .from('Staff')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (fetchError) throw fetchError;

    if (!staffMember) {
      return NextResponse.json(
        { error: 'Staff member not found' },
        { status: 404 }
      );
    }

    // Delete the staff record first.
    const { error: deleteError } = await supabaseAdmin
      .from('Staff')
      .delete()
      .eq('id', id);

    if (deleteError) throw deleteError;

    // Delete the linked auth user, if any.
    let userDeleted = false;
    if (staffMember.userId) {
      const { error: userError } = await supabaseAdmin.auth.admin.deleteUser(
        staffMember.userId
      );
      if (userError) {
        console.error('Error deleting user account:', userError);
        return NextResponse.json(
          {
            error:
              'Staff deleted but failed to delete associated user account.',
          },
          { status: 500 }
        );
      }
      userDeleted = true;
    }

    return NextResponse.json({
      message: 'Staff member deleted successfully',
      userDeleted,
    });
  } catch (error) {
    console.error('Error deleting staff member:', error);
    return NextResponse.json(
      { error: 'Failed to delete staff member' },
      { status: 500 }
    );
  }
}
