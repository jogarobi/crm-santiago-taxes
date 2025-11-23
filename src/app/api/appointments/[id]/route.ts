import { NextResponse } from 'next/server';
import { square } from '@/app/api/client';
import { Appointment, AppointmentErrorResponse } from '@/lib/types/appointment';
import { db } from '@/lib/db';
import { appointment } from '@/db/migrations/schema';
import { eq, or } from 'drizzle-orm';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const dbAppointment = await db
      .select({
        id: appointment.id,
        squareId: appointment.squareId,
        accountSquareId: appointment.accountSquareId,
        status: appointment.status,
        startAt: appointment.startAt,
        endAt: appointment.endAt,
        durationMinutes: appointment.durationMinutes,
        accountId: appointment.accountId,
        accountName: appointment.accountName,
        service: appointment.service,
        staffId: appointment.staffId,
        creatorType: appointment.creatorType,
        createdBy: appointment.createdBy,
        createdAt: appointment.createdAt,
        updatedAt: appointment.updatedAt,
        updatedBy: appointment.updatedBy,
      })
      .from(appointment)
      .where(or(eq(appointment.squareId, id), eq(appointment.id, parseInt(id) || 0)))
      .limit(1);

    if (dbAppointment.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Appointment not found',
          message: `No appointment found with id: ${id}`,
        } as AppointmentErrorResponse,
        { status: 404 }
      );
    }

    const apt = dbAppointment[0];
    const serializedAppointment = {
      id: apt.squareId || apt.id?.toString() || '',
      status: apt.status,
      startAt: apt.startAt,
      endAt: apt.endAt,
      durationMinutes: apt.durationMinutes || undefined,
      accountSquareId: apt.accountSquareId || undefined,
      accountName: apt.accountName || undefined,
      service: apt.service || undefined,
      customerId: apt.accountSquareId || undefined,
      creatorType: apt.creatorType,
      createdBy: apt.createdBy || undefined,
      createdAt: apt.createdAt || undefined,
      updatedAt: apt.updatedAt || undefined,
      updatedBy: apt.updatedBy || undefined,
    } as Appointment;

    return NextResponse.json({
      success: true,
      appointment: serializedAppointment,
    });
  } catch (error) {
    console.error('Error fetching appointment:', error);
    const errorResponse: AppointmentErrorResponse = {
      success: false,
      error: 'Failed to fetch appointment',
      message:
        error instanceof Error
          ? error.message
          : 'Internal server error occurred',
    };

    return NextResponse.json(errorResponse, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const response = await square.bookings.update({
      bookingId: id,
      booking: {
        startAt: body.startAt,
        locationId: body.locationId,
        customerId: body.customerId,
        customerNote: body.customerNote,
        sellerNote: body.sellerNote,
        appointmentSegments: body.appointmentSegments,
        version: body.version,
      },
    });

    // Serialize BigInt values
    const serializedAppointment: Appointment = JSON.parse(
      JSON.stringify(response, (_, value) =>
        typeof value === 'bigint' ? value.toString() : value
      )
    );

    return NextResponse.json({
      success: true,
      appointment: serializedAppointment,
    });
  } catch (error) {
    console.error('Error updating appointment:', error);
    const errorResponse: AppointmentErrorResponse = {
      success: false,
      error: 'Failed to update appointment',
      message:
        error instanceof Error
          ? error.message
          : 'Internal server error occurred',
    };

    return NextResponse.json(errorResponse, { status: 500 });
  }
}

// DELETE /api/appointments/[id] - Cancel an appointment
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const bookingVersion = searchParams.get('booking_version');

    const response = await square.bookings.cancel({
      bookingId: id,
      bookingVersion: bookingVersion ? parseInt(bookingVersion) : undefined,
    });

    // Serialize BigInt values
    const serializedAppointment: Appointment = JSON.parse(
      JSON.stringify(response, (_, value) =>
        typeof value === 'bigint' ? value.toString() : value
      )
    );

    return NextResponse.json({
      success: true,
      appointment: serializedAppointment,
      message: 'Appointment cancelled successfully',
    });
  } catch (error) {
    console.error('Error cancelling appointment:', error);
    const errorResponse: AppointmentErrorResponse = {
      success: false,
      error: 'Failed to cancel appointment',
      message:
        error instanceof Error
          ? error.message
          : 'Internal server error occurred',
    };

    return NextResponse.json(errorResponse, { status: 500 });
  }
}
