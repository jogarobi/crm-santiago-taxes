'use client';

import { useState, useEffect } from 'react';
import { usePayments } from '@/hooks/use-payments';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  Loader2,
  CreditCardIcon,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import type { Payment } from '@/lib/types/payment';

function formatCurrency(amount: bigint, currency: string): string {
  const numAmount = Number(amount) / 100;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'USD',
  }).format(numAmount);
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getStatusColor(status: string): string {
  switch (status.toUpperCase()) {
    case 'COMPLETED':
      return 'bg-green-100 text-green-800';
    case 'APPROVED':
      return 'bg-blue-100 text-blue-800';
    case 'PENDING':
      return 'bg-yellow-100 text-yellow-800';
    case 'CANCELED':
    case 'FAILED':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-neutral-100 text-neutral-800';
  }
}

export default function PaymentsPage() {
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize] = useState(50);

  useEffect(() => {
    document.title = 'Payments | Santiago Taxes CRM';
  }, []);

  const {
    data: response,
    isLoading,
    error,
  } = usePayments({
    pageSize,
    pageIndex,
    sortOrder: 'DESC',
  });

  const payments = response?.data || [];
  const totalPages = response?.meta?.totalPages || 0;
  const hasNextPage = pageIndex < totalPages - 1;
  const hasPreviousPage = pageIndex > 0;

  const handleNextPage = () => {
    if (hasNextPage) {
      setPageIndex((prev) => prev + 1);
    }
  };

  const handlePreviousPage = () => {
    if (hasPreviousPage) {
      setPageIndex((prev) => prev - 1);
    }
  };

  const handleFirstPage = () => {
    setPageIndex(0);
  };

  return (
    <div className='flex flex-col gap-6'>
      <div className='flex items-center justify-between'>
        <h1 className='text-2xl font-semibold'>Payments</h1>
      </div>

      {isLoading && (
        <div className='flex items-center justify-center py-12'>
          <Loader2 className='w-6 h-6 animate-spin text-purple' />
          <span className='ml-3 text-[15px] text-neutral-600'>
            Loading payments...
          </span>
        </div>
      )}

      {error && (
        <div className='bg-red-50 border border-red-200 rounded-lg p-4'>
          <p className='text-red-800'>
            Failed to load payments. Please try again later.
          </p>
        </div>
      )}

      {!isLoading && !error && (!payments || payments.length === 0) && (
        <div className='bg-white border rounded-lg p-12 text-center'>
          <CreditCardIcon
            className='w-8 h-8 text-neutral-400 mx-auto mb-4'
            strokeWidth={1.8}
          />
          <h3 className='text-[15px] text-neutral-500 mb-2'>
            No payments found
          </h3>
        </div>
      )}

      {!isLoading && !error && payments && payments.length > 0 && (
        <div className='bg-white border rounded-lg overflow-hidden'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className='p-4'>Date</TableHead>
                <TableHead className='p-4'>Amount</TableHead>
                <TableHead className='p-4'>Status</TableHead>
                <TableHead className='p-4'>Payment Method</TableHead>
                <TableHead className='p-4'>Receipt</TableHead>
                <TableHead className='p-4'>Customer ID</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((payment: Payment) => (
                <TableRow key={payment.id}>
                  <TableCell className='p-4'>
                    {formatDate(payment.createdAt)}
                  </TableCell>
                  <TableCell className='p-4 font-medium'>
                    <div className='flex flex-col'>
                      <span>
                        {formatCurrency(
                          payment.amountMoney.amount,
                          payment.amountMoney.currency
                        )}
                      </span>
                      {payment.refundedMoney &&
                        payment.refundedMoney.amount > BigInt(0) && (
                          <span className='text-xs text-red-600'>
                            Refunded:{' '}
                            {formatCurrency(
                              payment.refundedMoney.amount,
                              payment.refundedMoney.currency
                            )}
                          </span>
                        )}
                    </div>
                  </TableCell>
                  <TableCell className='p-4'>
                    <span
                      className={`text-xs font-medium px-2.5 py-1 rounded-full ${getStatusColor(
                        payment.status
                      )}`}
                    >
                      {payment.status}
                    </span>
                  </TableCell>
                  <TableCell className='p-4'>
                    {payment.cardDetails?.card ? (
                      <div className='flex items-center gap-2'>
                        <CreditCardIcon
                          size={16}
                          className='text-neutral-400'
                        />
                        <span className='text-sm'>
                          {payment.cardDetails.card.cardBrand}{' '}
                          {payment.cardDetails.card.last4 &&
                            `••••${payment.cardDetails.card.last4}`}
                        </span>
                      </div>
                    ) : (
                      <span className='text-neutral-400 text-sm'>
                        {payment.sourceType || '—'}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className='p-4'>
                    {payment.receiptUrl ? (
                      <a
                        href={payment.receiptUrl}
                        target='_blank'
                        rel='noopener noreferrer'
                        className='flex items-center gap-1 text-purple hover:text-purple/80'
                      >
                        <span className='text-sm'>View</span>
                        <ExternalLink size={14} />
                      </a>
                    ) : payment.receiptNumber ? (
                      <span className='text-sm text-neutral-600'>
                        {payment.receiptNumber}
                      </span>
                    ) : (
                      <span className='text-neutral-400'>—</span>
                    )}
                  </TableCell>
                  <TableCell className='p-4 text-sm text-neutral-600'>
                    {payment.customerId || '—'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className='flex items-center justify-between p-5 border-t'>
            <div className='flex items-center gap-4'>
              <p className='text-sm text-neutral-600'>
                Showing {payments.length} payment
                {payments.length !== 1 ? 's' : ''}
              </p>
            </div>

            {(hasNextPage || hasPreviousPage) && (
              <div className='flex items-center gap-5'>
                <div className='flex gap-2'>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={handleFirstPage}
                    disabled={!hasPreviousPage}
                    className='h-8 w-8 p-0'
                  >
                    <span className='sr-only'>First page</span>
                    <ChevronLeft className='h-4 w-4' />
                    <ChevronLeft className='h-4 w-4 -ml-3' />
                  </Button>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={handlePreviousPage}
                    disabled={!hasPreviousPage}
                    className='h-8 w-8 p-0'
                  >
                    <span className='sr-only'>Previous page</span>
                    <ChevronLeft className='h-4 w-4' />
                  </Button>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={handleNextPage}
                    disabled={!hasNextPage}
                    className='h-8 w-8 p-0'
                  >
                    <span className='sr-only'>Next page</span>
                    <ChevronRight className='h-4 w-4' />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
