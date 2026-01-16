/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import {
  staff,
  user,
  session as sessionTable,
  account as accountTable,
  member as memberTable,
  invitation as invitationTable,
} from '@/db/migrations/schema';
import { eq } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { requirePermission } from '@/lib/auth-utils';

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
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requirePermission({ staff: ['delete'] });

    const { id: idString } = await params;
    const id = parseInt(idString);

    console.log(`Received request to delete staff member with ID: ${id}`);

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

    // STEP 1: Delete the staff record FIRST (before user deletion to avoid FK constraint)
    console.log(`Deleting staff record for ID: ${id}`);
    await db.delete(staff).where(eq(staff.id, id));
    console.log('✓ Staff record deleted');

    // STEP 2: If staff had a linked user account, delete the user and all related records
    let removedFromOrg = false;
    if (staffData.userId) {
      console.log(`Staff member had linked user account: ${staffData.userId}`);

      // Try to remove from organization first
      try {
        await auth.api.removeMember({
          body: {
            memberIdOrEmail: staffData.email!,
            organizationId: activeOrg,
          },
          headers: await headers(),
        });
        removedFromOrg = true;
        console.log(`✓ Removed user ${staffData.userId} from organization`);
      } catch (error: any) {
        // If member not found, that's ok - they may have never been added to org
        if (
          error?.body?.message?.includes('Member not found') ||
          error?.statusCode === 400
        ) {
          console.log(
            `  User ${staffData.userId} was not a member of organization, continuing with deletion`
          );
        } else {
          console.error('  Error removing member from organization:', error);
          // For other errors, we still continue to delete the user
        }
      }

      // Delete the user account and all related records
      try {
        console.log(`Deleting all records for user ${staffData.userId}`);

        // 1. Delete sessions
        await db
          .delete(sessionTable)
          .where(eq(sessionTable.userId, staffData.userId));
        console.log('  ✓ Deleted sessions');

        // 2. Delete accounts
        await db
          .delete(accountTable)
          .where(eq(accountTable.userId, staffData.userId));
        console.log('  ✓ Deleted accounts');

        // 3. Delete invitations (as inviter)
        await db
          .delete(invitationTable)
          .where(eq(invitationTable.inviterId, staffData.userId));
        console.log('  ✓ Deleted invitations');

        // 4. Delete member records (in case removeMember didn't catch all)
        await db
          .delete(memberTable)
          .where(eq(memberTable.userId, staffData.userId));
        console.log('  ✓ Deleted member records');

        // 5. Finally delete the user
        await db.delete(user).where(eq(user.id, staffData.userId));
        console.log(
          `✓ Deleted user account ${staffData.userId}`
        );
      } catch (error) {
        console.error('Error deleting user account:', error);
        // Note: Staff is already deleted at this point
        return NextResponse.json(
          {
            error:
              'Staff deleted but failed to delete associated user account.',
          },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      message: 'Staff member deleted successfully',
      userDeleted: !!staffData.userId,
      removedFromOrganization: removedFromOrg,
    });
  } catch (error) {
    console.error('Error deleting staff member:', error);
    return NextResponse.json(
      { error: 'Failed to delete staff member' },
      { status: 500 }
    );
  }
}
