/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { staff } from '@/db/migrations/schema';
import { eq } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
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

    const updateData: any = {
      updatedAt: new Date().toISOString(),
      updatedBy: body.updatedBy,
    };

    // Only update fields that are provided
    if (body.firstName !== undefined) updateData.firstName = body.firstName;
    if (body.lastName !== undefined) updateData.lastName = body.lastName;
    if (body.title !== undefined) updateData.title = body.title;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.email !== undefined) updateData.email = body.email || null;
    if (body.squareId !== undefined)
      updateData.squareId = body.squareId || null;

    const result = await db
      .update(staff)
      .set(updateData)
      .where(eq(staff.id, id))
      .returning();

    if (result.length === 0) {
      return NextResponse.json(
        { error: 'Staff member not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error('Error updating staff member:', error);
    return NextResponse.json(
      { error: 'Failed to update staff member' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idString } = await params;
    const id = parseInt(idString);

    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid staff ID' }, { status: 400 });
    }

    // Get the current session to verify permissions and get organization ID
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the active organization
    const activeOrg = session.session.activeOrganizationId;
    if (!activeOrg) {
      return NextResponse.json(
        { error: 'No active organization found' },
        { status: 400 }
      );
    }

    // First, get the staff member to check if they have a linked user account
    const staffMember = await db
      .select()
      .from(staff)
      .where(eq(staff.id, id))
      .limit(1);

    if (staffMember.length === 0) {
      return NextResponse.json(
        { error: 'Staff member not found' },
        { status: 404 }
      );
    }

    const staffData = staffMember[0];

    // If the staff member has a linked user account, remove them from the organization
    if (staffData.userId) {
      try {
        await auth.api.removeMember({
          body: {
            memberIdOrEmail: staffData.userId,
            organizationId: activeOrg,
          },
          headers: await headers(),
        });
      } catch (error) {
        console.error('Error removing member from organization:', error);
        // Continue with staff deletion even if organization removal fails
      }
    }

    // Delete the staff record
    await db.delete(staff).where(eq(staff.id, id)).returning();

    return NextResponse.json({
      message: 'Staff member deleted successfully',
      removedFromOrganization: !!staffData.userId,
    });
  } catch (error) {
    console.error('Error deleting staff member:', error);
    return NextResponse.json(
      { error: 'Failed to delete staff member' },
      { status: 500 }
    );
  }
}
