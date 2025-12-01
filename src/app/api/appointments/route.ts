import { square } from '@/app/api/client';
import { appointment } from '@/db/migrations/schema';
import { db } from '@/lib/db';
import {
  Appointment,
  AppointmentErrorResponse,
  AppointmentResponse,
} from '@/lib/types/appointment';
import { and, asc, gte, lte } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { AppointmentSegment } from 'square';

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
      accountId: apt.accountId,
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
    const locationId = process.env.SQUARE_LOCATION_ID!;
    const body = await request.json();

    if (!body.startAt || !body.appointmentSegments) {
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
        locationId,
        customerId: body.customerId,
        customerNote: body.customerNote,
        sellerNote: body.sellerNote,
        appointmentSegments: body.appointmentSegments.map(
          (segment: AppointmentSegment) => ({
            ...segment,
            serviceVariationVersion:
              typeof segment.serviceVariationVersion === 'string'
                ? BigInt(segment.serviceVariationVersion)
                : segment.serviceVariationVersion,
          })
        ),
      },
    });

    const serializedResponse = JSON.parse(
      JSON.stringify(response, (_, value) =>
        typeof value === 'bigint' ? value.toString() : value
      )
    );

    return NextResponse.json(
      {
        success: true,
        appointment: serializedResponse,
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
