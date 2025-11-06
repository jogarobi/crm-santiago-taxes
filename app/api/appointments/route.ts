import { NextResponse } from 'next/server';
import { square } from '@/app/api/client';
import {
  Appointment,
  AppointmentResponse,
  AppointmentErrorResponse,
} from '@/lib/types/appointment';

// GET /api/appointments - List all appointments with optional filters
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const cursor = searchParams.get('cursor') || undefined;
    const customerId = searchParams.get('customer_id') || undefined;
    const teamMemberId = searchParams.get('team_member_id') || undefined;
    const locationId = searchParams.get('location_id') || undefined;
    const startAtMin = searchParams.get('start_at_min') || undefined;
    const startAtMax = searchParams.get('start_at_max') || undefined;

    const response = await square.bookings.list({
      limit,
      cursor,
      customerId,
      teamMemberId,
      locationId,
      startAtMin,
      startAtMax,
    });

    // Serialize BigInt values to strings for JSON compatibility
    const serializedAppointments: Appointment[] = JSON.parse(
      JSON.stringify(response.data || [], (_, value) =>
        typeof value === 'bigint' ? value.toString() : value
      )
    );

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
