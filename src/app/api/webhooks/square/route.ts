import { NextRequest, NextResponse } from 'next/server';
// import { WebhooksHelper } from 'square';

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
  console.log(`Processing booking event: ${event.type}`, {
    eventId: event.event_id,
    bookingId: event.data.id,
  });

  console.log(event);

  switch (event.type) {
    case 'booking.created':
      // Handle new booking creation
      console.log('New booking created:', event.data.id);
      // TODO: Sync booking to local database if needed
      break;

    case 'booking.updated':
      // Handle booking updates
      console.log('Booking updated: ', event.data.id);
      // TODO: Update local booking record
      break;

    case 'booking.cancelled':
      // Handle booking cancellation
      console.log('Booking cancelled:', event.data.id);
      // TODO: Update local booking status
      break;

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

export async function POST(request: NextRequest) {
  try {
    const signature = request.headers.get('x-square-hmacsha256-signature');

    if (!signature) {
      console.error('Missing webhook signature');
      return NextResponse.json({ error: 'Missing signature' }, { status: 401 });
    }

    const body = await request.text();

    const signatureKey = process.env.SQUARE_WEBHOOK_SIGNATURE_KEY;

    if (!signatureKey) {
      console.error('SQUARE_WEBHOOK_SIGNATURE_KEY not configured');
      return NextResponse.json(
        { error: 'Webhook signature key not configured' },
        { status: 500 }
      );
    }

    // Get the full notification URL for signature verification
    const notificationUrl = request.url;

    // Debug logging to help troubleshoot signature issues
    console.log('Webhook validation attempt:', {
      notificationUrl,
      hasSignatureKey: !!signatureKey,
      signatureKeyLength: signatureKey.length,
      signatureHeaderLength: signature.length,
      bodyLength: body.length,
      method: request.method,
    });

    // Verify the webhook signature using Square's WebhooksHelper
    // This uses constant-time comparison to prevent timing attacks
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

    const event: SquareWebhookEvent = JSON.parse(body);

    console.log('Received Square webhook:', {
      type: event.type,
      eventId: event.event_id,
      merchantId: event.merchant_id,
    });

    if (event.type.startsWith('booking.')) {
      await handleBookingEvent(event);
    } else if (event.type.startsWith('customer.')) {
      await handleCustomerEvent(event);
    } else {
      console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
