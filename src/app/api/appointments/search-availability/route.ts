import { NextResponse } from 'next/server';
import { square } from '@/app/api/clients';
import { AppointmentErrorResponse } from '@/lib/types/appointment';
import { requirePermission } from '@/lib/auth-utils';

export async function POST(request: Request) {
  try {
    await requirePermission({ appointment: ['read'] });

    const locationId = process.env.SQUARE_LOCATION_ID!;
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

    const queryWithLocation = {
      ...body,
      query: {
        ...body.query,
        filter: {
          ...body.query.filter,
          locationId,
        },
      },
    };

    const response = await square.bookings.searchAvailability(
      queryWithLocation
    );

    const serializedAvailabilities = JSON.parse(
      JSON.stringify(response || [], (_, value) =>
        typeof value === 'bigint' ? value.toString() : value
      )
    );

    return NextResponse.json({
      success: true,
      availabilities: serializedAvailabilities.availabilities,
      count: serializedAvailabilities.availabilities.length,
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
