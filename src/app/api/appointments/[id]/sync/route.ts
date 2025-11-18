import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { appointment } from '@/db/migrations/schema';
import { eq } from 'drizzle-orm';

// PATCH /api/appointments/[id]/sync - Link an appointment to a client account
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    if (!body.accountId) {
      return NextResponse.json(
        { error: 'Missing required field: accountId' },
        { status: 400 }
      );
    }

    // Update the appointment to link it to the account
    const updatedAppointment = await db
      .update(appointment)
      .set({
        accountId: body.accountId,
        updatedAt: new Date().toISOString(),
        updatedBy: 'system', // TODO: Replace with actual user
      })
      .where(eq(appointment.id, parseInt(id)))
      .returning();

    if (!updatedAppointment || updatedAppointment.length === 0) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      appointment: updatedAppointment[0],
    });
  } catch (error) {
    console.error('Error syncing appointment:', error);
    return NextResponse.json(
      { error: 'Failed to sync appointment' },
      { status: 500 }
    );
  }
}
