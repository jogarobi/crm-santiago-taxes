import { NextResponse } from 'next/server';
import { square } from '@/app/api/clients';
import { supabaseAdmin, nextId } from '@/lib/supabase/admin';
import { requirePermission } from '@/lib/auth-utils';
import type * as Square from 'square';

async function resolveServiceName(
  serviceVariationId: string
): Promise<string | null> {
  try {
    const catalogResponse = await square.catalog.object.get({
      objectId: serviceVariationId,
      includeRelatedObjects: true,
    });
    const relatedObjects = catalogResponse.relatedObjects || [];
    const serviceObject = relatedObjects.find((obj) => obj.type === 'ITEM');
    return serviceObject?.itemData?.name || null;
  } catch {
    return null;
  }
}

async function resolveStaffId(teamMemberId: string): Promise<number | null> {
  try {
    const { data: existing } = await supabaseAdmin
      .from('Staff')
      .select('id')
      .eq('squareId', teamMemberId)
      .maybeSingle();
    if (existing) return existing.id;

    const result = await square.teamMembers.get({ teamMemberId });
    if (!result.teamMember) return null;

    const { data: inserted, error } = await supabaseAdmin
      .from('Staff')
      .insert({
        id: await nextId('Staff'),
        squareId: result.teamMember.id || '',
        title:
          result.teamMember.wageSetting?.jobAssignments?.[0]?.jobTitle ||
          'Staff',
        status: result.teamMember.status || 'INACTIVE',
        firstName: result.teamMember.givenName || 'Unknown',
        lastName: result.teamMember.familyName || 'Unknown',
        createdAt: new Date().toISOString(),
        createdBy: 'SQUARE_SYNC',
      })
      .select('id')
      .single();

    if (error) return null;
    return inserted.id;
  } catch {
    return null;
  }
}

async function resolveStaffName(teamMemberId: string): Promise<string | null> {
  try {
    const { data: existing } = await supabaseAdmin
      .from('Staff')
      .select('firstName, lastName')
      .eq('squareId', teamMemberId)
      .maybeSingle();
    if (existing) {
      return `${existing.firstName ?? ''} ${existing.lastName ?? ''}`.trim() || null;
    }

    const result = await square.teamMembers.get({ teamMemberId });
    const member = result.teamMember;
    if (!member) return null;
    return (
      `${member.givenName ?? ''} ${member.familyName ?? ''}`.trim() || null
    );
  } catch {
    return null;
  }
}

// Resolve a human-readable name for whoever actually booked the appointment,
// based on the creator details Square returns on the booking.
async function resolveBookedBy(
  creatorDetails: Square.BookingCreatorDetails | undefined,
  customerName: string | null
): Promise<string> {
  const creatorType = creatorDetails?.creatorType;
  if (creatorType === 'TEAM_MEMBER' && creatorDetails?.teamMemberId) {
    return (
      (await resolveStaffName(creatorDetails.teamMemberId)) || 'Staff member'
    );
  }
  if (creatorType === 'CUSTOMER') {
    return customerName || 'Customer';
  }
  return customerName || 'Customer';
}

const CANCELLED_STATUSES = new Set([
  'CANCELLED_BY_CUSTOMER',
  'CANCELLED_BY_SELLER',
  'DECLINED',
]);

export async function POST(request: Request) {
  try {
    await requirePermission({ appointment: ['read'] });

    const locationId = process.env.SQUARE_LOCATION_ID!;

    const body = await request.json().catch(() => ({}));
    let startAt: string;
    let endAt: string;

    if (body.startAtMin && body.startAtMax) {
      startAt = body.startAtMin;
      endAt = body.startAtMax;
    } else {
      const now = new Date();
      const start = new Date(now);
      start.setDate(now.getDate() - now.getDay());
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);
      startAt = start.toISOString();
      endAt = end.toISOString();
    }

    const page = await square.bookings.list({
      locationId,
      startAtMin: startAt,
      startAtMax: endAt,
      limit: 100,
    });

    const bookings: Square.Booking[] = [];
    for await (const booking of page) {
      bookings.push(booking);
    }

    let synced = 0;

    for (const booking of bookings) {
      if (!booking.id) continue;

      const bookingId = booking.id;
      const customerId = booking.customerId;
      const status = booking.status ?? 'PENDING';
      const bookingStartAt = booking.startAt ?? new Date().toISOString();
      const creatorDetails = booking.creatorDetails;
      const segment = booking.appointmentSegments?.[0];
      const durationMinutes = segment?.durationMinutes ?? 60;
      const bookingEndAt = new Date(
        new Date(bookingStartAt).getTime() + durationMinutes * 60000
      ).toISOString();

      // Resolve customer
      let clientId: number | null = null;
      let accountName: string | null = null;
      if (customerId) {
        const { data: client } = await supabaseAdmin
          .from('Clients')
          .select('id, firstName, lastName')
          .eq('squareId', customerId)
          .maybeSingle();
        if (client) {
          clientId = client.id;
          accountName = `${client.firstName} ${client.lastName}`;
        } else {
          try {
            const customerResponse = await square.customers.get({ customerId });
            const customer = customerResponse.customer;
            if (customer) {
              accountName =
                `${customer.givenName || ''} ${customer.familyName || ''}`.trim() ||
                null;
            }
          } catch {
            /* ignore */
          }
        }
      }

      const serviceVariationId = segment?.serviceVariationId;
      const teamMemberId = segment?.teamMemberId;
      const serviceName = serviceVariationId
        ? await resolveServiceName(serviceVariationId)
        : null;
      const staffId = teamMemberId ? await resolveStaffId(teamMemberId) : null;
      const bookedBy = await resolveBookedBy(creatorDetails, accountName);

      const values = {
        squareId: bookingId,
        clientSquareId: customerId || 'N/A',
        status,
        startAt: bookingStartAt,
        endAt: bookingEndAt,
        durationMinutes,
        staffId: staffId ?? 0,
        clientId,
        accountName: accountName ?? '',
        service: serviceName ?? '',
        creatorType: creatorDetails?.creatorType || 'CUSTOMER',
        createdBy: bookedBy,
        updatedAt: new Date().toISOString(),
        updatedBy: 'SQUARE_SYNC',
      };

      const { data: existing } = await supabaseAdmin
        .from('Appointments')
        .select('id')
        .eq('squareId', bookingId)
        .maybeSingle();

      if (!existing) {
        if (CANCELLED_STATUSES.has(status)) continue;
        await supabaseAdmin.from('Appointments').insert({
          ...values,
          id: await nextId('Appointments'),
          createdAt: new Date().toISOString(),
        });
      } else {
        await supabaseAdmin
          .from('Appointments')
          .update(values)
          .eq('squareId', bookingId);
      }

      synced++;
    }

    return NextResponse.json({
      success: true,
      synced,
      weekStart: startAt,
      weekEnd: endAt,
    });
  } catch (error) {
    console.error('Error syncing appointments from Square:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Sync failed',
      },
      { status: 500 }
    );
  }
}
