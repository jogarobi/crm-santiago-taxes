import { NextRequest, NextResponse } from 'next/server';
import { square } from '@/app/api/clients';
import { supabaseAdmin, nextId } from '@/lib/supabase/admin';

type SquareWebhookEvent = {
  merchant_id: string;
  type: string;
  event_id: string;
  created_at: string;
  data: {
    type: string;
    id: string;
    object?: Record<string, unknown>;
  };
};

async function getOrCreateActivityType(
  name: string,
  icon: string
): Promise<number> {
  const { data: existing } = await supabaseAdmin
    .from('ActitityTypes')
    .select('id')
    .eq('name', name)
    .maybeSingle();

  if (existing) return existing.id;

  const { data: created, error } = await supabaseAdmin
    .from('ActitityTypes')
    .insert({
      id: await nextId('ActitityTypes'),
      name,
      icon,
      createdAt: new Date().toISOString(),
      createdBy: 'SYSTEM',
    })
    .select('id')
    .single();

  if (error) throw error;
  return created.id;
}

async function resolveStaffId(teamMemberId: string): Promise<number | null> {
  try {
    const { data: staffMember } = await supabaseAdmin
      .from('Staff')
      .select('id')
      .eq('squareId', teamMemberId)
      .maybeSingle();

    if (staffMember) return staffMember.id;

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
        createdBy: 'SQUARE_WEBHOOK',
      })
      .select('id')
      .single();

    if (error) return null;
    return inserted.id;
  } catch (error) {
    console.error(
      `Failed to resolve staff for teamMemberId ${teamMemberId}:`,
      error
    );
    return null;
  }
}

async function resolveCreatedBy(creatorDetails?: {
  teamMemberId?: string;
  customerId?: string;
  creatorType?: string;
}): Promise<string | null> {
  try {
    if (creatorDetails?.teamMemberId) {
      const result = await square.teamMembers.get({
        teamMemberId: creatorDetails.teamMemberId,
      });
      const tm = result.teamMember;
      if (tm) return `${tm.givenName || ''} ${tm.familyName || ''}`.trim() || null;
    } else if (creatorDetails?.customerId) {
      const result = await square.customers.get({
        customerId: creatorDetails.customerId,
      });
      const c = result.customer;
      if (c) return `${c.givenName || ''} ${c.familyName || ''}`.trim() || null;
    }
  } catch (error) {
    console.error('Failed to resolve createdBy:', error);
  }
  return null;
}

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
  } catch (error) {
    console.error(
      `Failed to retrieve service ${serviceVariationId} from Square:`,
      error
    );
    return null;
  }
}

async function handleBookingEvent(event: SquareWebhookEvent) {
  const bookingId = event.data.id.split(':')[0];

  console.log(`Processing booking event: ${event.type}`, {
    eventId: event.event_id,
    bookingId,
  });

  switch (event.type) {
    case 'booking.created':
    case 'booking.updated': {
      let booking;
      try {
        const response = await square.bookings.get({ bookingId });
        booking = response.booking;
      } catch (error) {
        console.error(`Failed to fetch booking ${bookingId} from Square:`, error);
        return;
      }

      if (!booking || !booking.id) {
        console.error('Booking not found in Square:', bookingId);
        return;
      }

      // Resolve customer
      let clientId: number | null = null;
      let accountName: string | null = null;
      if (booking.customerId) {
        const { data: dbAccount } = await supabaseAdmin
          .from('Clients')
          .select('id, firstName, lastName')
          .eq('squareId', booking.customerId)
          .maybeSingle();

        if (dbAccount) {
          clientId = dbAccount.id;
          accountName = `${dbAccount.firstName} ${dbAccount.lastName}`;
        } else {
          try {
            const customerResponse = await square.customers.get({
              customerId: booking.customerId,
            });
            const customer = customerResponse.customer;
            if (customer)
              accountName =
                `${customer.givenName || ''} ${customer.familyName || ''}`.trim() ||
                null;
          } catch (error) {
            console.error(
              `Failed to fetch customer ${booking.customerId} from Square:`,
              error
            );
          }
        }
      }

      const segment = booking.appointmentSegments?.[0];
      const serviceName = segment?.serviceVariationId
        ? await resolveServiceName(segment.serviceVariationId)
        : null;
      const staffId = segment?.teamMemberId
        ? await resolveStaffId(segment.teamMemberId)
        : null;

      const createdBy = await resolveCreatedBy(
        booking.creatorDetails as Parameters<typeof resolveCreatedBy>[0]
      );

      const startAt = booking.startAt || new Date().toISOString();
      const durationMinutes = segment?.durationMinutes || 60;
      const endAt = new Date(
        new Date(startAt).getTime() + durationMinutes * 60000
      ).toISOString();

      const baseValues = {
        squareId: booking.id,
        clientSquareId: booking.customerId || 'N/A',
        status: booking.status || 'PENDING',
        startAt,
        endAt,
        durationMinutes,
        staffId: staffId ?? 0,
        clientId,
        accountName: accountName ?? '',
        service: serviceName ?? '',
        creatorType: booking.creatorDetails?.creatorType || 'CUSTOMER',
      };

      const { data: existing } = await supabaseAdmin
        .from('Appointments')
        .select('id')
        .eq('squareId', booking.id)
        .maybeSingle();

      if (event.type === 'booking.created' || !existing) {
        const { data: newAppt } = await supabaseAdmin
          .from('Appointments')
          .insert({
            ...baseValues,
            id: await nextId('Appointments'),
            createdBy: createdBy || 'SQUARE_WEBHOOK',
            createdAt: new Date().toISOString(),
          })
          .select('id')
          .single();

        console.log('✅ Appointment created:', newAppt?.id);

        if (event.type === 'booking.created') {
          try {
            const activityTypeId = await getOrCreateActivityType(
              'Appointment',
              'Calendar'
            );
            const withPerson =
              booking.creatorDetails?.creatorType === 'TEAM_MEMBER'
                ? accountName || 'a customer'
                : createdBy || 'staff';
            await supabaseAdmin.from('Activities').insert({
              id: await nextId('Activities'),
              clientId,
              typeId: activityTypeId,
              title: `${createdBy || 'Someone'} booked an appointment with ${withPerson}${serviceName ? ` for ${serviceName}` : ''}`,
              createdAt: new Date().toISOString(),
              createdBy: createdBy || 'SQUARE_WEBHOOK',
              entity: 'appointment',
              entityId: newAppt?.id ?? null,
            });
          } catch (error) {
            console.error('Failed to create activity:', error);
          }
        }
      } else {
        await supabaseAdmin
          .from('Appointments')
          .update({
            ...baseValues,
            updatedBy: createdBy,
            updatedAt: new Date().toISOString(),
          })
          .eq('squareId', booking.id);
        console.log('✅ Appointment updated:', booking.id);
      }
      break;
    }

    case 'booking.cancelled': {
      const { data: appointmentToCancel } = await supabaseAdmin
        .from('Appointments')
        .select('*')
        .eq('squareId', bookingId)
        .maybeSingle();

      await supabaseAdmin
        .from('Appointments')
        .update({
          status: 'CANCELLED',
          updatedBy: 'SQUARE_WEBHOOK',
          updatedAt: new Date().toISOString(),
        })
        .eq('squareId', bookingId);

      console.log('✅ Appointment cancelled:', bookingId);

      if (appointmentToCancel) {
        try {
          const activityTypeId = await getOrCreateActivityType(
            'Appointment Cancelled',
            'X'
          );
          await supabaseAdmin.from('Activities').insert({
            id: await nextId('Activities'),
            clientId: appointmentToCancel.clientId ?? null,
            typeId: activityTypeId,
            title: `Appointment${appointmentToCancel.service ? ` for ${appointmentToCancel.service}` : ''} with ${appointmentToCancel.accountName || 'customer'} was cancelled`,
            createdAt: new Date().toISOString(),
            createdBy: 'SQUARE_WEBHOOK',
            entity: 'appointment',
            entityId: appointmentToCancel.id ?? null,
          });
        } catch (error) {
          console.error('Failed to create cancellation activity:', error);
        }
      }
      break;
    }

    default:
      console.log(`Unhandled booking event type: ${event.type}`);
  }
}

async function handleCustomerEvent(event: SquareWebhookEvent) {
  console.log(`Processing customer event: ${event.type}`, {
    eventId: event.event_id,
    customerId: event.data.id,
  });

  switch (event.type) {
    case 'customer.created':
      console.log('New customer created:', event.data.id);
      break;
    case 'customer.updated':
      console.log('Customer updated:', event.data.id);
      break;
    case 'customer.deleted':
      console.log('Customer deleted:', event.data.id);
      break;
    default:
      console.log(`Unhandled customer event type: ${event.type}`);
  }
}

async function writeLog(
  statusCode: number,
  message: string,
  eventType: string,
  eventId: string,
  payload: string
) {
  try {
    let parsedPayload: unknown = payload;
    try {
      parsedPayload = JSON.parse(payload);
    } catch {
      /* keep raw string */
    }
    await supabaseAdmin.from('Logs').insert({
      statusCode,
      message,
      eventType,
      eventId,
      payload: parsedPayload as never,
      createdAt: new Date().toISOString(),
    });
  } catch (logError) {
    console.error('Failed to write to log table:', logError);
  }
}

export async function POST(request: NextRequest) {
  let body = '';
  let webhookEvent: SquareWebhookEvent | null = null;

  const signature = request.headers.get('x-square-hmacsha256-signature');
  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 401 });
  }

  try {
    body = await request.text();
  } catch {
    return NextResponse.json({ error: 'Failed to read body' }, { status: 400 });
  }

  const signatureKey = process.env.SQUARE_WEBHOOK_SIGNATURE_KEY;
  if (!signatureKey) {
    console.error('SQUARE_WEBHOOK_SIGNATURE_KEY not configured');
    await writeLog(
      500,
      'SQUARE_WEBHOOK_SIGNATURE_KEY env var not set',
      'unknown',
      'unknown',
      body
    );
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 });
  }

  try {
    webhookEvent = JSON.parse(body) as SquareWebhookEvent;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
  }

  console.log('Received Square webhook:', {
    type: webhookEvent.type,
    eventId: webhookEvent.event_id,
    merchantId: webhookEvent.merchant_id,
  });

  try {
    if (webhookEvent.type.startsWith('booking.')) {
      await handleBookingEvent(webhookEvent);
    } else if (webhookEvent.type.startsWith('customer.')) {
      await handleCustomerEvent(webhookEvent);
    } else {
      console.log(`Unhandled event type: ${webhookEvent.type}`);
    }
  } catch (error) {
    console.error('Error processing webhook event:', error);
    await writeLog(
      500,
      error instanceof Error ? error.message : 'Unknown processing error',
      webhookEvent.type,
      webhookEvent.event_id,
      body
    );
    return NextResponse.json({
      received: true,
      error: 'Processing failed — logged',
    });
  }

  return NextResponse.json({ received: true });
}
