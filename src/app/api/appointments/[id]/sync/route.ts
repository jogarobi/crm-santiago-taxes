import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { requirePermission, actorFromSession } from '@/lib/auth-utils';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { session } = await requirePermission({ appointment: ['update'] });
    const actor = actorFromSession(session);

    const { id } = await params;
    const body = await request.json();

    if (!body.accountId) {
      return NextResponse.json(
        { error: 'Missing required field: accountId' },
        { status: 400 }
      );
    }

    const numericId = parseInt(id);
    const filter = isNaN(numericId)
      ? `squareId.eq.${id}`
      : `squareId.eq.${id},id.eq.${numericId}`;

    const { data: updated, error } = await supabaseAdmin
      .from('Appointments')
      .update({
        clientId: body.accountId,
        updatedAt: new Date().toISOString(),
        updatedBy: actor,
      })
      .or(filter)
      .select();

    if (error) throw error;

    if (!updated || updated.length === 0) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      );
    }

    // If customerId is provided, update the client's squareId.
    if (body.customerId) {
      await supabaseAdmin
        .from('Clients')
        .update({
          squareId: body.customerId,
          updatedAt: new Date().toISOString(),
          updatedBy: actor,
        })
        .eq('id', body.accountId);
    }

    return NextResponse.json({
      success: true,
      appointment: updated[0],
    });
  } catch (error) {
    console.error('Error syncing appointment:', error);
    return NextResponse.json(
      { error: 'Failed to sync appointment' },
      { status: 500 }
    );
  }
}
