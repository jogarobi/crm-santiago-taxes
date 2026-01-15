export interface Payment {
  id: string;
  createdAt: string;
  updatedAt?: string;
  amountMoney: {
    amount: bigint;
    currency: string;
  };
  status: string;
  sourceType?: string;
  cardDetails?: {
    status?: string;
    card?: {
      cardBrand?: string;
      last4?: string;
      expMonth?: bigint;
      expYear?: bigint;
    };
    entryMethod?: string;
  };
  customerId?: string;
  locationId?: string;
  orderId?: string;
  receiptNumber?: string;
  receiptUrl?: string;
  refundedMoney?: {
    amount: bigint;
    currency: string;
  };
  totalMoney?: {
    amount: bigint;
    currency: string;
  };
}

export interface PaginatedPaymentsResponse {
  payments: Payment[];
  cursor?: string;
  hasMore: boolean;
}

export interface FetchPaymentsParams {
  limit?: number;
  cursor?: string;
  beginTime?: string;
  endTime?: string;
  sortOrder?: 'ASC' | 'DESC';
}
