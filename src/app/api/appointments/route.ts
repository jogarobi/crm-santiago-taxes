import { square } from '@/app/api/clients';
import { supabaseAdmin, nextId } from '@/lib/supabase/admin';
import {
  Appointment,
  AppointmentErrorResponse,
  AppointmentResponse,
} from '@/lib/types/appointment';
import { NextResponse } from 'next/server';
import { AppointmentSegment } from 'square';
import { requirePermission, actorFromSession } from '@/lib/auth-utils';

const CANCELLED_STATUSES = [
  'CANCELLED_BY_CUSTOMER',
  'CANCELLED_BY_SELLER',
  'DECLINED',
];

export async function GET(request: Request) {
  try {
    await requirePermission({ appointment: ['read'] });
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const startAtMin = searchParams.get('start_at_min') || undefined;
    const startAtMax = searchParams.get('start_at_max') || undefined;
    const accountId = searchParams.get('account_id') || undefined;

    let query = supabaseAdmin
      .from('Appointments')
      .select('*')
      .not('status', 'in', `(${CANCELLED_STATUSES.join(',')})`);

    if (startAtMin) query = query.gte('startAt', startAtMin);
    if (startAtMax) query = query.lte('startAt', startAtMax);
    if (accountId) query = query.eq('clientId', parseInt(accountId));

    const { data, error } = await query
      .order('startAt', { ascending: true })
      .limit(limit);

    if (error) throw error;

    const serializedAppointments: Appointment[] = (data ?? []).map((apt) => ({
      id: apt.squareId || apt.id?.toString() || '',
      accountId: apt.clientId,
      status: apt.status,
      startAt: apt.startAt,
      endAt: apt.endAt,
      durationMinutes: apt.durationMinutes || undefined,
      accountSquareId: apt.clientSquareId || undefined,
      accountName: apt.accountName || undefined,
      service: apt.service || undefined,
      staffId: apt.staffId ?? null,
      customerId: apt.clientSquareId || undefined,
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
    const { session } = await requirePermission({ appointment: ['create'] });
    const actor = actorFromSession(session);

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

    // @ts-expect-error - Square SDK types may vary
    const booking = response.result?.booking || response.booking;
    if (booking?.id) {
      try {
        const startAt = new Date(booking.startAt || body.startAt);
        const durationMinutes =
          booking.appointmentSegments?.[0]?.durationMinutes || 30;
        const endAt = new Date(startAt.getTime() + durationMinutes * 60000);

        // Resolve client info from the Square customer id.
        let clientId: number | null = null;
        let accountName = '';
        if (body.customerId) {
          const { data: client } = await supabaseAdmin
            .from('Clients')
            .select('id, firstName, lastName')
            .eq('squareId', body.customerId)
            .maybeSingle();
          if (client) {
            clientId = client.id;
            if (client.firstName && client.lastName) {
              accountName = `${client.firstName} ${client.lastName}`;
            }
          }
        }

        // Resolve staff from the booking's team member (Staff.squareId).
        let staffId = 0;
        const teamMemberId = booking.appointmentSegments?.[0]?.teamMemberId;
        if (teamMemberId) {
          const { data: staffRow } = await supabaseAdmin
            .from('Staff')
            .select('id')
            .eq('squareId', teamMemberId)
            .maybeSingle();
          if (staffRow) staffId = staffRow.id;
        }

        await supabaseAdmin.from('Appointments').insert({
          id: await nextId('Appointments'),
          squareId: booking.id,
          status: booking.status || 'PENDING',
          startAt: startAt.toISOString(),
          endAt: endAt.toISOString(),
          durationMinutes,
          clientId,
          accountName,
          service: body.serviceName || '',
          clientSquareId: body.customerId || '',
          staffId,
          creatorType: 'SYSTEM',
          createdBy: actor,
          createdAt: new Date().toISOString(),
        });
      } catch (dbError) {
        console.error('Error saving appointment to database:', dbError);
        // Don't fail the request if database save fails.
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
