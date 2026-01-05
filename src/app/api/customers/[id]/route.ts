import { NextResponse } from 'next/server';
import { square } from '@/app/api/clients';
import {
  Customer,
  CustomerResponse,
  CustomerErrorResponse,
} from '@/lib/types/customer';

// GET /api/customers/[id] - Retrieve a single customer
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      const errorResponse: CustomerErrorResponse = {
        success: false,
        error: 'Missing customer ID',
        message: 'Customer ID is required',
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    const response = await square.customers.get({ customerId: id });

    // Serialize BigInt values to strings for JSON compatibility
    const serializedCustomer: Customer = JSON.parse(
      JSON.stringify(response.customer || {}, (_, value) =>
        typeof value === 'bigint' ? value.toString() : value
      )
    );

    const customerResponse: CustomerResponse = {
      success: true,
      customer: serializedCustomer,
    };

    return NextResponse.json(customerResponse);
  } catch (error) {
    console.error('Error fetching customer:', error);
    const errorResponse: CustomerErrorResponse = {
      success: false,
      error: 'Failed to fetch customer',
      message:
        error instanceof Error
          ? error.message
          : 'Internal server error occurred',
    };

    return NextResponse.json(errorResponse, { status: 500 });
  }
}
