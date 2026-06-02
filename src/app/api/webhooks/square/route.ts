import { NextRequest, NextResponse } from 'next/server';
import { square } from '@/app/api/clients';
import { db } from '@/lib/db';
import {
  appointment,
  clientAccount,
  log,
  staff,
  activity,
  activityType,
} from '@/db/migrations/schema';
import { eq } from 'drizzle-orm';

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
  const existingType = await db
    .select()
    .from(activityType)
    .where(eq(activityType.name, name))
    .limit(1);

  if (existingType.length > 0) {
    return existingType[0].id;
  }

  const result = await db
    .insert(activityType)
    .values({
      name,
      icon,
      createdAt: new Date().toISOString(),
      createdBy: 'SYSTEM',
    })
    .returning();

  return result[0].id;
}

async function resolveStaffId(teamMemberId: string): Promise<number | null> {
  try {
    const staffMember = await db
      .select()
      .from(staff)
      .where(eq(staff.squareId, teamMemberId))
      .limit(1);

    if (staffMember.length > 0) return staffMember[0].id;

    const result = await square.teamMembers.get({ teamMemberId });
    if (!result.teamMember) return null;

    const staffResult = await db.insert(staff).values({
      squareId: result.teamMember.id || '',
      title: result.teamMember.wageSetting?.jobAssignments?.[0]?.jobTitle || 'Staff',
      status: result.teamMember.status || 'INACTIVE',
      firstName: result.teamMember.givenName || 'Unknown',
      lastName: result.teamMember.familyName || 'Unknown',
      createdAt: new Date().toISOString(),
      createdBy: 'SQUARE_WEBHOOK',
    });
    return staffResult.lastInsertRowid ? Number(staffResult.lastInsertRowid) : null;
  } catch (error) {
    console.error(`Failed to resolve staff for teamMemberId ${teamMemberId}:`, error);
    return null;
  }
}

async function resolveCreatedBy(creatorDetails?: { teamMemberId?: string; customerId?: string; creatorType?: string }): Promise<string | null> {
  try {
    if (creatorDetails?.teamMemberId) {
      const result = await square.teamMembers.get({ teamMemberId: creatorDetails.teamMemberId });
      const tm = result.teamMember;
      if (tm) return `${tm.givenName || ''} ${tm.familyName || ''}`.trim() || null;
    } else if (creatorDetails?.customerId) {
      const result = await square.customers.get({ customerId: creatorDetails.customerId });
      const c = result.customer;
      if (c) return `${c.givenName || ''} ${c.familyName || ''}`.trim() || null;
    }
  } catch (error) {
    console.error('Failed to resolve createdBy:', error);
  }
  return null;
}

async function resolveServiceName(serviceVariationId: string): Promise<string | null> {
  try {
    const catalogResponse = await square.catalog.object.get({
      objectId: serviceVariationId,
      includeRelatedObjects: true,
    });
    const relatedObjects = catalogResponse.relatedObjects || [];
    const serviceObject = relatedObjects.find((obj) => obj.type === 'ITEM');
    return serviceObject?.itemData?.name || null;
  } catch (error) {
    console.error(`Failed to retrieve service ${serviceVariationId} from Square:`, error);
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
      let dbAccount = null;
      let accountName: string | null = null;
      if (booking.customerId) {
        const accounts = await db
          .select()
          .from(clientAccount)
          .where(eq(clientAccount.squareId, booking.customerId))
          .limit(1);
        dbAccount = accounts[0] || null;

        if (dbAccount) {
          accountName = `${dbAccount.firstName} ${dbAccount.lastName}`;
        } else {
          try {
            const customerResponse = await square.customers.get({ customerId: booking.customerId });
            const customer = customerResponse.customer;
            if (customer) accountName = `${customer.givenName || ''} ${customer.familyName || ''}`.trim() || null;
          } catch (error) {
            console.error(`Failed to fetch customer ${booking.customerId} from Square:`, error);
          }
        }
      }

      // Resolve service name and staff
      const segment = booking.appointmentSegments?.[0];
      const serviceName = segment?.serviceVariationId
        ? await resolveServiceName(segment.serviceVariationId)
        : null;
      const staffId = segment?.teamMemberId
        ? await resolveStaffId(segment.teamMemberId)
        : null;

      const createdBy = await resolveCreatedBy(booking.creatorDetails as Parameters<typeof resolveCreatedBy>[0]);

      const startAt = booking.startAt || new Date().toISOString();
      const durationMinutes = segment?.durationMinutes || 60;
      const endAt = new Date(new Date(startAt).getTime() + durationMinutes * 60000).toISOString();

      if (event.type === 'booking.created') {
        const newAppointment = await db
          .insert(appointment)
          .values({
            squareId: booking.id,
            accountSquareId: booking.customerId || 'N/A',
            status: booking.status || 'PENDING',
            startAt,
            endAt,
            durationMinutes,
            staffId,
            accountId: dbAccount?.id || null,
            accountName,
            service: serviceName,
            creatorType: booking.creatorDetails?.creatorType || 'CUSTOMER',
            createdBy,
            createdAt: new Date().toISOString(),
          })
          .returning();

        console.log('✅ Appointment created:', newAppointment[0]?.id);

        try {
          const activityTypeId = await getOrCreateActivityType('Appointment', 'Calendar');
          const withPerson = booking.creatorDetails?.creatorType === 'TEAM_MEMBER'
            ? (accountName || 'a customer')
            : (createdBy || 'staff');
          await db.insert(activity).values({
            accountId: dbAccount?.id || null,
            typeId: activityTypeId,
            title: `${createdBy || 'Someone'} booked an appointment with ${withPerson}${serviceName ? ` for ${serviceName}` : ''}`,
            createdAt: new Date().toISOString(),
            createdBy: createdBy || 'SQUARE_WEBHOOK',
            entity: 'appointment',
            entityId: newAppointment[0]?.id || null,
          });
        } catch (error) {
          console.error('Failed to create activity:', error);
        }
      } else {
        // booking.updated
        const existing = await db
          .select()
          .from(appointment)
          .where(eq(appointment.squareId, booking.id))
          .limit(1);

        if (existing.length === 0) {
          // Upsert if not found
          const newAppt = await db
            .insert(appointment)
            .values({
              squareId: booking.id,
              accountSquareId: booking.customerId || 'N/A',
              status: booking.status || 'PENDING',
              startAt,
              endAt,
              durationMinutes,
              accountId: dbAccount?.id || null,
              accountName,
              service: serviceName,
              staffId,
              creatorType: booking.creatorDetails?.creatorType || 'CUSTOMER',
              createdBy,
              createdAt: new Date().toISOString(),
            })
            .returning();
          console.log('✅ Appointment created (from update event):', newAppt[0]?.id);
        } else {
          await db
            .update(appointment)
            .set({
              status: booking.status || 'PENDING',
              startAt,
              endAt,
              durationMinutes,
              accountId: dbAccount?.id || null,
              accountName,
              service: serviceName,
              staffId,
              updatedBy: createdBy,
              updatedAt: new Date().toISOString(),
            })
            .where(eq(appointment.squareId, booking.id));
          console.log('✅ Appointment updated:', booking.id);
        }
      }
      break;
    }

    case 'booking.cancelled': {
      const appointmentToCancel = await db
        .select()
        .from(appointment)
        .where(eq(appointment.squareId, bookingId))
        .limit(1);

      await db
        .update(appointment)
        .set({ status: 'CANCELLED', updatedBy: 'SQUARE_WEBHOOK', updatedAt: new Date().toISOString() })
        .where(eq(appointment.squareId, bookingId));

      console.log('✅ Appointment cancelled:', bookingId);

      if (appointmentToCancel.length > 0) {
        try {
          const activityTypeId = await getOrCreateActivityType('Appointment Cancelled', 'X');
          const appt = appointmentToCancel[0];
          await db.insert(activity).values({
            accountId: appt.accountId || null,
            typeId: activityTypeId,
            title: `Appointment${appt.service ? ` for ${appt.service}` : ''} with ${appt.accountName || 'customer'} was cancelled`,
            createdAt: new Date().toISOString(),
            createdBy: 'SQUARE_WEBHOOK',
            entity: 'appointment',
            entityId: appt.id || null,
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
      // TODO: Sync customer to local database
      break;

    case 'customer.updated':
      console.log('Customer updated:', event.data.id);
      // TODO: Update local customer record
      break;

    case 'customer.deleted':
      console.log('Customer deleted:', event.data.id);
      // TODO: Handle customer deletion
      break;

    default:
      console.log(`Unhandled customer event type: ${event.type}`);
  }
}

async function writeLog(statusCode: number, message: string, eventType: string, eventId: string, payload: string) {
  try {
    await db.insert(log).values({
      statusCode,
      message,
      eventType,
      eventId,
      paylaod: payload,
      createdBy: 'SQUARE_WEBHOOK',
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
    await writeLog(500, 'SQUARE_WEBHOOK_SIGNATURE_KEY env var not set', 'unknown', 'unknown', body);
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
    // Return 200 so Square does not retry and create duplicate records
    return NextResponse.json({ received: true, error: 'Processing failed — logged' });
  }

  return NextResponse.json({ received: true });
}
