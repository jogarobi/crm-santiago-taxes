import { NextResponse } from 'next/server';
import { square } from '@/app/api/client';
import {
  Appointment,
  AppointmentResponse,
  AppointmentErrorResponse,
} from '@/lib/types/appointment';
import { db } from '@/lib/db';
import { appointment } from '@/db/migrations/schema';
import { and, gte, lte, asc } from 'drizzle-orm';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const startAtMin = searchParams.get('start_at_min') || undefined;
    const startAtMax = searchParams.get('start_at_max') || undefined;

    const conditions = [];

    if (startAtMin) {
      conditions.push(gte(appointment.startAt, startAtMin));
    }

    if (startAtMax) {
      conditions.push(lte(appointment.startAt, startAtMax));
    }

    const dbAppointments = await db
      .select()
      .from(appointment)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(asc(appointment.startAt))
      .limit(limit);

    const serializedAppointments: Appointment[] = dbAppointments.map((apt) => ({
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

export async function POST(request: Request) {
  try {
    const body = await request.json();

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
