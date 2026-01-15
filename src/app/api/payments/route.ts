import { square } from '@/app/api/clients';
import { NextResponse } from 'next/server';
import type { Payment } from '@/lib/types/payment';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const pageSize = Math.min(
      parseInt(searchParams.get('pageSize') || '50'),
      200
    );
    const pageIndex = parseInt(searchParams.get('pageIndex') || '0');
    const beginTime = searchParams.get('beginTime') || undefined;
    const endTime = searchParams.get('endTime') || undefined;
    const sortOrder = (searchParams.get('sortOrder') || 'DESC') as
      | 'ASC'
      | 'DESC';

    // Fetch payments from Square
    const page = await square.payments.list({
      beginTime,
      endTime,
      sortOrder,
      limit: 200, // Fetch a larger batch to support pagination
    });

    const allPayments: Payment[] = [];
    for (const payment of page.data) {
      allPayments.push({
        id: payment.id || '',
        createdAt: payment.createdAt || '',
        updatedAt: payment.updatedAt,
        amountMoney: {
          amount: payment.amountMoney?.amount || BigInt(0),
          currency: payment.amountMoney?.currency || 'USD',
        },
        status: payment.status || '',
        sourceType: payment.sourceType,
        cardDetails: payment.cardDetails
          ? {
              status: payment.cardDetails.status,
              card: payment.cardDetails.card
                ? {
                    cardBrand: payment.cardDetails.card.cardBrand?.toString(),
                    last4: payment.cardDetails.card.last4,
                    expMonth: payment.cardDetails.card.expMonth ?? undefined,
                    expYear: payment.cardDetails.card.expYear ?? undefined,
                  }
                : undefined,
              entryMethod: payment.cardDetails.entryMethod,
            }
          : undefined,
        customerId: payment.customerId,
        locationId: payment.locationId,
        orderId: payment.orderId,
        receiptNumber: payment.receiptNumber,
        receiptUrl: payment.receiptUrl,
        refundedMoney: payment.refundedMoney
          ? {
              amount: payment.refundedMoney.amount || BigInt(0),
              currency: payment.refundedMoney.currency || 'USD',
            }
          : undefined,
        totalMoney: payment.totalMoney
          ? {
              amount: payment.totalMoney.amount || BigInt(0),
              currency: payment.totalMoney.currency || 'USD',
            }
          : undefined,
      });
    }

    // Apply offset pagination
    const startIndex = pageIndex * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedPayments = allPayments.slice(startIndex, endIndex);

    const serializedPayments: Payment[] = JSON.parse(
      JSON.stringify(paginatedPayments, (_, value) =>
        typeof value === 'bigint' ? value.toString() : value
      )
    );

    return NextResponse.json({
      data: serializedPayments,
      meta: {
        total: allPayments.length,
        pageSize,
        pageIndex,
        totalPages: Math.ceil(allPayments.length / pageSize),
      },
    });
  } catch (error) {
    console.error('Failed to fetch payments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payments' },
      { status: 500 }
    );
  }
}
