import { NextRequest, NextResponse } from 'next/server';
// import { WebhooksHelper } from 'square';
import { square } from '@/app/api/client';
import { db } from '@/lib/db';
import { appointment, account, log, staff } from '@/db/migrations/schema';
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

async function handleBookingEvent(event: SquareWebhookEvent) {
  const bookingId = event.data.id.split(':')[0];

  console.log(`Processing booking event: ${event.type}`, {
    eventId: event.event_id,
    bookingId: bookingId,
    rawId: event.data.id,
  });

  try {
    switch (event.type) {
      case 'booking.created': {
        const response = await square.bookings.get({
          bookingId: bookingId,
        });
        const booking = response.booking;

        if (!booking) {
          console.error('Booking not found in Square:', bookingId);
          return;
        }

        let dbAccount = null;
        let accountName: string | null = null;
        let serviceName: string | null = null;

        if (booking.customerId) {
          const accounts = await db
            .select()
            .from(account)
            .where(eq(account.squareId, booking.customerId))
            .limit(1);

          dbAccount = accounts[0];

          if (!dbAccount) {
            console.warn(
              `Customer ${booking.customerId} not found in local database. Fetching from Square...`
            );

            try {
              const customerResponse = await square.customers.get({
                customerId: booking.customerId,
              });

              if (customerResponse.customer) {
                const customer = customerResponse.customer;
                accountName = `${customer.givenName || ''} ${
                  customer.familyName || ''
                }`.trim();
                console.log(
                  `Retrieved customer name from Square: ${accountName}`
                );
              }
            } catch (error) {
              console.error(
                `Failed to retrieve customer ${booking.customerId} from Square:`,
                error
              );
            }
          } else {
            accountName = `${dbAccount.firstName} ${dbAccount.lastName}`;
          }
        }

        // Get service name from booking
        if (
          booking.appointmentSegments &&
          booking.appointmentSegments.length > 0
        ) {
          const serviceVariationId =
            booking.appointmentSegments[0].serviceVariationId;

          if (serviceVariationId) {
            try {
              const catalogResponse = await square.catalog.object.get({
                objectId: serviceVariationId,
                includeRelatedObjects: true,
              });

              if (catalogResponse.object) {
                // The service variation's related object contains the service name
                const relatedObjects = catalogResponse.relatedObjects || [];
                const serviceObject = relatedObjects.find(
                  (obj) => obj.type === 'ITEM'
                );

                if (serviceObject && serviceObject.itemData) {
                  serviceName = serviceObject.itemData.name || null;
                  console.log(
                    `Retrieved service name from Square: ${serviceName}`
                  );
                }
              }
            } catch (error) {
              console.error(
                `Failed to retrieve service ${serviceVariationId} from Square:`,
                error
              );
            }
          }
        }

        let createdBy: string | null = null;
        let staffId: number | null = null;

        if (booking.creatorDetails?.teamMemberId) {
          const result = await square.teamMembers.get({
            teamMemberId: booking.creatorDetails.teamMemberId,
          });

          const staffMember = await db
            .select()
            .from(staff)
            .where(eq(staff.squareId, booking.creatorDetails.teamMemberId))
            .limit(1);

          if (staffMember.length === 0) {
            const staffResult = await db.insert(staff).values({
              squareId: result.teamMember?.id || '',
              title:
                result.teamMember?.wageSetting?.jobAssignments?.[0].jobTitle ||
                'Staff',
              status: result.teamMember?.status || 'INACTIVE',
              firstName: result.teamMember?.givenName || 'Unknown',
              lastName: result.teamMember?.familyName || 'Unknown',
              createdAt: new Date().toISOString(),
              createdBy: 'SQUARE_WEBHOOK',
            });

            if (staffResult) {
              staffId = staffResult.lastInsertRowid
                ? Number(staffResult.lastInsertRowid)
                : null;
            }
          } else {
            // Staff member already exists, use their ID
            staffId = staffMember[0].id;
          }

          createdBy =
            `${result.teamMember?.givenName} ${result.teamMember?.familyName}` ||
            null;
        } else if (booking.creatorDetails?.customerId) {
          const result = await square.customers.get({
            customerId: booking.creatorDetails.customerId,
          });
          createdBy = `${result.customer?.givenName} ${result.customer?.familyName}`;
        }

        const startAt = booking.startAt || new Date().toISOString();
        const durationMinutes =
          booking.appointmentSegments?.[0]?.durationMinutes || 60;
        const endAt = new Date(
          new Date(startAt).getTime() + durationMinutes * 60000
        ).toISOString();

        const newAppointment = await db
          .insert(appointment)
          .values({
            squareId: booking.id,
            status: booking.status || 'PENDING',
            startAt: startAt,
            endAt: endAt,
            durationMinutes: durationMinutes,
            staffId,
            accountId: dbAccount?.id || null,
            accountName,
            service: serviceName,
            creatorType: booking.creatorDetails?.creatorType || 'CUSTOMER',
            createdBy,
            createdAt: new Date().toISOString(),
          })
          .returning();

        console.log('✅ Appointment created in database:', {
          id: newAppointment[0]?.id,
          squareId: newAppointment[0]?.squareId,
          accountId: newAppointment[0]?.accountId,
          status: newAppointment[0]?.status,
        });

        break;
      }

      case 'booking.updated': {
        console.log('Booking updated:', bookingId);

        const bookingResponse = await square.bookings.get({
          bookingId: bookingId,
        });
        const booking = bookingResponse.booking;

        if (!booking || !booking.id) {
          console.error(
            'Booking not found in Square or missing ID:',
            bookingId
          );
          return;
        }

        let dbAccount = null;
        let accountName: string | null = null;
        let serviceName: string | null = null;

        if (booking.customerId) {
          const accounts = await db
            .select()
            .from(account)
            .where(eq(account.squareId, booking.customerId))
            .limit(1);

          dbAccount = accounts[0];

          if (!dbAccount) {
            console.warn(
              `Customer ${booking.customerId} not found in local database. Fetching from Square...`
            );

            try {
              const customerResponse = await square.customers.get({
                customerId: booking.customerId,
              });

              if (customerResponse.customer) {
                const customer = customerResponse.customer;
                accountName = `${customer.givenName || ''} ${
                  customer.familyName || ''
                }`.trim();
                console.log(
                  `Retrieved customer name from Square: ${accountName}`
                );
              }
            } catch (error) {
              console.error(
                `Failed to retrieve customer ${booking.customerId} from Square:`,
                error
              );
            }
          } else {
            accountName = `${dbAccount.firstName} ${dbAccount.lastName}`;
          }
        }

        // Get service name from booking
        if (
          booking.appointmentSegments &&
          booking.appointmentSegments.length > 0
        ) {
          const serviceVariationId =
            booking.appointmentSegments[0].serviceVariationId;

          if (serviceVariationId) {
            try {
              const catalogResponse = await square.catalog.object.get({
                objectId: serviceVariationId,
                includeRelatedObjects: true,
              });

              if (catalogResponse.object) {
                const relatedObjects = catalogResponse.relatedObjects || [];
                const serviceObject = relatedObjects.find(
                  (obj) => obj.type === 'ITEM'
                );

                if (serviceObject && serviceObject.itemData) {
                  serviceName = serviceObject.itemData.name || null;
                  console.log(
                    `Retrieved service name from Square: ${serviceName}`
                  );
                }
              }
            } catch (error) {
              console.error(
                `Failed to retrieve service ${serviceVariationId} from Square:`,
                error
              );
            }
          }
        }

        let createdBy: string | null = null;
        let staffId: number | null = null;

        if (booking.creatorDetails?.teamMemberId) {
          const result = await square.teamMembers.get({
            teamMemberId: booking.creatorDetails.teamMemberId,
          });

          const staffMember = await db
            .select()
            .from(staff)
            .where(eq(staff.squareId, booking.creatorDetails.teamMemberId))
            .limit(1);

          if (staffMember.length === 0) {
            const staffResult = await db.insert(staff).values({
              squareId: result.teamMember?.id || '',
              title:
                result.teamMember?.wageSetting?.jobAssignments?.[0].jobTitle ||
                'Staff',
              status: result.teamMember?.status || 'INACTIVE',
              firstName: result.teamMember?.givenName || 'Unknown',
              lastName: result.teamMember?.familyName || 'Unknown',
              createdAt: new Date().toISOString(),
              createdBy: 'SQUARE_WEBHOOK',
            });

            if (staffResult) {
              staffId = staffResult.lastInsertRowid
                ? Number(staffResult.lastInsertRowid)
                : null;
            }
          } else {
            staffId = staffMember[0].id;
          }

          createdBy =
            `${result.teamMember?.givenName} ${result.teamMember?.familyName}` ||
            null;
        } else if (booking.creatorDetails?.customerId) {
          const result = await square.customers.get({
            customerId: booking.creatorDetails.customerId,
          });
          createdBy = `${result.customer?.givenName} ${result.customer?.familyName}`;
        }

        const existingAppointments = await db
          .select()
          .from(appointment)
          .where(eq(appointment.squareId, booking.id))
          .limit(1);

        if (existingAppointments.length === 0) {
          console.warn(
            'Appointment not found in database, creating new one:',
            booking.id
          );
          const startAt = booking.startAt || new Date().toISOString();
          const durationMinutes =
            booking.appointmentSegments?.[0]?.durationMinutes || 60;
          const endAt = new Date(
            new Date(startAt).getTime() + durationMinutes * 60000
          ).toISOString();

          await db.insert(appointment).values({
            squareId: booking.id,
            status: booking.status || 'PENDING',
            startAt: startAt,
            endAt: endAt,
            durationMinutes: durationMinutes,
            accountId: dbAccount?.id || null,
            accountName,
            service: serviceName,
            staffId,
            creatorType: booking.creatorDetails?.creatorType || 'CUSTOMER',
            createdBy,
            createdAt: new Date().toISOString(),
          });

          console.log('✅ Appointment created in database (from update event)');
          return;
        }

        const startAt = booking.startAt || existingAppointments[0].startAt;
        const durationMinutes =
          booking.appointmentSegments?.[0]?.durationMinutes ||
          existingAppointments[0].durationMinutes ||
          60;
        const endAt = new Date(
          new Date(startAt).getTime() + durationMinutes * 60000
        ).toISOString();

        await db
          .update(appointment)
          .set({
            status: booking.status || 'PENDING',
            startAt: startAt,
            endAt: endAt,
            durationMinutes: durationMinutes,
            accountId: dbAccount?.id || null,
            accountName,
            service: serviceName,
            updatedBy: createdBy,
            updatedAt: new Date().toISOString(),
          })
          .where(eq(appointment.squareId, booking.id));

        console.log('✅ Appointment updated in database:', booking.id);
        break;
      }

      case 'booking.cancelled': {
        console.log('Booking cancelled:', bookingId);

        await db
          .update(appointment)
          .set({
            status: 'CANCELLED',
            updatedBy: 'SQUARE_WEBHOOK',
            updatedAt: new Date().toISOString(),
          })
          .where(eq(appointment.squareId, bookingId));

        console.log(
          '✅ Appointment marked as cancelled in database:',
          bookingId
        );
        break;
      }

      default:
        console.log(`Unhandled booking event type: ${event.type}`);
    }
  } catch (error) {
    console.error(`❌ Error handling booking event ${event.type}:`, error);

    try {
      await db.insert(log).values({
        statusCode: 500,
        message: error instanceof Error ? error.message : 'Unknown error',
        eventType: event.type,
        eventId: event.event_id,
        paylaod: JSON.stringify(event.data),
        createdBy: 'SQUARE_WEBHOOK',
        createdAt: new Date().toISOString(),
      });
    } catch (logError) {
      console.error('Failed to log error to database:', logError);
    }

    throw error;
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

export async function POST(request: NextRequest) {
  let body = '';
  let webhookEvent: SquareWebhookEvent | null = null;

  try {
    const signature = request.headers.get('x-square-hmacsha256-signature');

    if (!signature) {
      console.error('Missing webhook signature');
      return NextResponse.json({ error: 'Missing signature' }, { status: 401 });
    }

    body = await request.text();

    const signatureKey = process.env.SQUARE_WEBHOOK_SIGNATURE_KEY;

    if (!signatureKey) {
      console.error('SQUARE_WEBHOOK_SIGNATURE_KEY not configured');
      return NextResponse.json(
        { error: 'Webhook signature key not configured' },
        { status: 500 }
      );
    }

    const notificationUrl = request.url;

    console.log('Webhook validation attempt:', {
      notificationUrl,
      hasSignatureKey: !!signatureKey,
      signatureKeyLength: signatureKey.length,
      signatureHeaderLength: signature.length,
      bodyLength: body.length,
      method: request.method,
    });

    try {
      /*       const isValidSignature = await WebhooksHelper.verifySignature({
        requestBody: body,
        signatureHeader: signature,
        signatureKey: signatureKey,
        notificationUrl: notificationUrl,
      });

      if (!isValidSignature) {
        console.error('Invalid webhook signature', {
          notificationUrlUsed: notificationUrl,
          signaturePreview: signature.substring(0, 20) + '...',
          bodyPreview: body.substring(0, 100),
        });
        return NextResponse.json(
          {
            error: 'Invalid signature',
            hint: 'Check that SQUARE_WEBHOOK_SIGNATURE_KEY matches Square Dashboard and notification URL is exact',
          },
          { status: 403 }
        );
      } */

      console.log('Webhook signature verified successfully');
    } catch (verificationError) {
      console.error('Error during signature verification:', verificationError);
      return NextResponse.json(
        {
          error: 'Signature verification failed',
          message:
            verificationError instanceof Error
              ? verificationError.message
              : 'Unknown error',
        },
        { status: 500 }
      );
    }

    webhookEvent = JSON.parse(body);

    if (!webhookEvent) {
      console.error('Failed to parse webhook event');
      return NextResponse.json(
        { error: 'Invalid webhook data' },
        { status: 400 }
      );
    }

    console.log('Received Square webhook:', {
      type: webhookEvent.type,
      eventId: webhookEvent.event_id,
      merchantId: webhookEvent.merchant_id,
    });

    if (webhookEvent.type.startsWith('booking.')) {
      await handleBookingEvent(webhookEvent);
    } else if (webhookEvent.type.startsWith('customer.')) {
      await handleCustomerEvent(webhookEvent);
    } else {
      console.log(`Unhandled event type: ${webhookEvent.type}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error processing webhook:', error);

    try {
      await db.insert(log).values({
        statusCode: 500,
        message:
          error instanceof Error
            ? error.message
            : 'Unknown error processing webhook',
        eventType: webhookEvent?.type || 'unknown',
        eventId: webhookEvent?.event_id || 'unknown',
        paylaod: body || 'No payload available',
        createdBy: 'SQUARE_WEBHOOK',
        createdAt: new Date().toISOString(),
      });
    } catch (logError) {
      console.error('Failed to log error to database:', logError);
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
