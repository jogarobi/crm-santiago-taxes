import { square } from '@/app/api/client';
import { clientAccount, appointment } from '@/db/migrations/schema';
import { db } from '@/lib/db';
import {
  Appointment,
  AppointmentErrorResponse,
  AppointmentResponse,
} from '@/lib/types/appointment';
import { and, asc, eq, gte, lte } from 'drizzle-orm';
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

    // Save appointment to Turso database
    // @ts-expect-error - Square SDK types may vary
    const booking = response.result?.booking || response.booking;
    if (booking?.id) {
      try {
        // Calculate endAt time
        const startAt = new Date(booking.startAt || body.startAt);
        const durationMinutes =
          booking.appointmentSegments?.[0]?.durationMinutes || 30;
        const endAt = new Date(startAt.getTime() + durationMinutes * 60000);

        // Get account info if customerId is provided
        let accountId: number | undefined;
        let accountName: string | undefined;
        if (body.customerId) {
          const accountResult = await db
            .select()
            .from(clientAccount)
            .where(eq(clientAccount.squareId, body.customerId))
            .limit(1);

          if (accountResult.length > 0) {
            accountId = accountResult[0].id || undefined;
            const firstName = accountResult[0].firstName;
            const lastName = accountResult[0].lastName;
            if (firstName && lastName) {
              accountName = `${firstName} ${lastName}`;
            }
          }
        }

        await db.insert(appointment).values({
          squareId: booking.id,
          status: booking.status || 'PENDING',
          startAt: startAt.toISOString(),
          endAt: endAt.toISOString(),
          durationMinutes,
          accountId,
          accountName,
          service: body.serviceName,
          accountSquareId: body.customerId || '',
          creatorType: 'SYSTEM',
          createdBy: 'CRM',
          createdAt: new Date().toISOString(),
        });
      } catch (dbError) {
        console.error('Error saving appointment to database:', dbError);
        // Don't fail the request if database save fails
      }
    }

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
