import { NextResponse } from 'next/server';
import { square } from '@/app/api/client';
import {
  Appointment,
  AppointmentResponse,
  AppointmentErrorResponse,
} from '@/lib/types/appointment';
import { db } from '@/lib/db';
import { appointment, account } from '@/db/migrations/schema';
import { and, gte, lte, eq, asc } from 'drizzle-orm';

// GET /api/appointments - List all appointments with optional filters
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const startAtMin = searchParams.get('start_at_min') || undefined;
    const startAtMax = searchParams.get('start_at_max') || undefined;

    // Build the query conditions
    const conditions = [];

    if (startAtMin) {
      conditions.push(gte(appointment.startAt, startAtMin));
    }

    if (startAtMax) {
      conditions.push(lte(appointment.startAt, startAtMax));
    }

    // Query the database
    const dbAppointments = await db
      .select({
        id: appointment.id,
        squareId: appointment.squareId,
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
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(asc(appointment.startAt))
      .limit(limit);

    // Map database appointments to match the Appointment type
    const serializedAppointments: Appointment[] = dbAppointments.map((apt) => ({
      id: apt.squareId || apt.id?.toString() || '',
      status: apt.status,
      startAt: apt.startAt,
      endAt: apt.endAt,
      durationMinutes: apt.durationMinutes || undefined,
      accountName: apt.accountName || undefined,
      service: apt.service || undefined,
      customerId: apt.accountId?.toString() || undefined,
      creatorType: apt.creatorType,
      createdBy: apt.createdBy || undefined,
      createdAt: apt.createdAt || undefined,
      updatedAt: apt.updatedAt || undefined,
      updatedBy: apt.updatedBy || undefined,
    })) as Appointment[];

    const appointmentResponse: AppointmentResponse = {
      success: true,
      appointments: serializedAppointments,
      count: serializedAppointments.length,
    };

    return NextResponse.json(appointmentResponse);
  } catch (error) {
    console.error('Error fetching appointments:', error);
    const errorResponse: AppointmentErrorResponse = {
      success: false,
      error: 'Failed to fetch appointments',
      message:
        error instanceof Error
          ? error.message
          : 'Internal server error occurred',
    };

    return NextResponse.json(errorResponse, { status: 500 });
  }
}

// POST /api/appointments - Create a new appointment
export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.startAt || !body.locationId || !body.appointmentSegments) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields',
          message: 'startAt, locationId, and appointmentSegments are required',
        } as AppointmentErrorResponse,
        { status: 400 }
      );
    }

    const response = await square.bookings.create({
      booking: {
        startAt: body.startAt,
        locationId: body.locationId,
        customerId: body.customerId,
        customerNote: body.customerNote,
        sellerNote: body.sellerNote,
        appointmentSegments: body.appointmentSegments,
      },
    });

    // Serialize BigInt values
    const serializedAppointment: Appointment = JSON.parse(
      JSON.stringify(response, (_, value) =>
        typeof value === 'bigint' ? value.toString() : value
      )
    );

    return NextResponse.json(
      {
        success: true,
        appointment: serializedAppointment,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating appointment:', error);
    const errorResponse: AppointmentErrorResponse = {
      success: false,
      error: 'Failed to create appointment',
      message:
        error instanceof Error
          ? error.message
          : 'Internal server error occurred',
    };

    return NextResponse.json(errorResponse, { status: 500 });
  }
}
