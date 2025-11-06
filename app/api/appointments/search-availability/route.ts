import { NextResponse } from 'next/server';
import { square } from '@/app/api/client';
import { AppointmentErrorResponse } from '@/lib/types/appointment';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body.query) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required field',
          message: 'query is required',
        } as AppointmentErrorResponse,
        { status: 400 }
      );
    }

    const response = await square.bookings.searchAvailability(body);

    const serializedAvailabilities = JSON.parse(
      JSON.stringify(response || [], (_, value) =>
        typeof value === 'bigint' ? value.toString() : value
      )
    );

    return NextResponse.json({
      success: true,
      availabilities: serializedAvailabilities,
      count: serializedAvailabilities.length,
    });
  } catch (error) {
    console.error('Error searching availability:', error);
    const errorResponse: AppointmentErrorResponse = {
      success: false,
      error: 'Failed to search availability',
      message:
        error instanceof Error
          ? error.message
          : 'Internal server error occurred',
    };

    return NextResponse.json(errorResponse, { status: 500 });
  }
}
