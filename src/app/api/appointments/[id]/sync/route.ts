import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { appointment, clientAccount } from '@/db/migrations/schema';
import { eq, or } from 'drizzle-orm';

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

    const numericId = parseInt(id);
    const updatedAppointment = await db
      .update(appointment)
      .set({
        accountId: body.accountId,
        updatedAt: new Date().toISOString(),
        updatedBy: 'system',
      })
      .where(
        or(
          eq(appointment.squareId, id),
          isNaN(numericId) ? undefined : eq(appointment.id, numericId)
        )
      )
      .returning();

    if (!updatedAppointment || updatedAppointment.length === 0) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      );
    }

    // If customerId is provided, update the account's squareId
    if (body.customerId) {
      await db
        .update(clientAccount)
        .set({
          squareId: body.customerId,
          updatedAt: new Date().toISOString(),
          updatedBy: 'system',
        })
        .where(eq(clientAccount.id, body.accountId));
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
