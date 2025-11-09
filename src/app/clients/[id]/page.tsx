'use client';

import { use } from 'react';
import { useAccount } from '@/lib/hooks/use-accounts';
import { Loader2 } from 'lucide-react';

type Props = {
  params: Promise<{ id: string }>;
};

export default function AccountDetailPage({ params }: Props) {
  const { id } = use(params);
  const accountId = parseInt(id);
  const { data: account, isLoading, error } = useAccount(accountId);

  if (isLoading) {
    return (
      <div className='flex items-center justify-center p-8'>
        <Loader2 className='animate-spin' />
        <span className='ml-2'>Loading account...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className='p-8'>
        <div className='bg-red-50 border border-red-200 rounded-lg p-4'>
          <p className='text-red-800'>Error loading account: {error.message}</p>
        </div>
      </div>
    );
  }

  if (!account) {
    return (
      <div className='p-8'>
        <div className='bg-yellow-50 border border-yellow-200 rounded-lg p-4'>
          <p className='text-yellow-800'>Account not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className='flex flex-col gap-6'>
      <div className='bg-white border rounded-lg p-6'>
        <h1 className='text-2xl font-bold text-purple mb-6'>
          {account.firstName} {account.lastName}
        </h1>

        <div className='grid grid-cols-2 gap-6'>
          <div>
            <label className='text-sm text-neutral-500'>Account ID</label>
            <p className='font-medium'>{account.id}</p>
          </div>

          <div>
            <label className='text-sm text-neutral-500'>Date of Birth</label>
            <p className='font-medium'>{account.dateOfBirth}</p>
          </div>

          {account.ssnLastFour && (
            <div>
              <label className='text-sm text-neutral-500'>SSN (Last 4)</label>
              <p className='font-medium'>***-**-{account.ssnLastFour}</p>
            </div>
          )}

          {account.address && (
            <div>
              <label className='text-sm text-neutral-500'>Address</label>
              <p className='font-medium'>{account.address}</p>
            </div>
          )}

          {account.city && (
            <div>
              <label className='text-sm text-neutral-500'>City</label>
              <p className='font-medium'>{account.city}</p>
            </div>
          )}

          {account.state && (
            <div>
              <label className='text-sm text-neutral-500'>State</label>
              <p className='font-medium'>{account.state}</p>
            </div>
          )}

          {account.zipCode && (
            <div>
              <label className='text-sm text-neutral-500'>Zip Code</label>
              <p className='font-medium'>{account.zipCode}</p>
            </div>
          )}

          {account.squareId && (
            <div>
              <label className='text-sm text-neutral-500'>Square ID</label>
              <p className='font-medium'>{account.squareId}</p>
            </div>
          )}

          <div>
            <label className='text-sm text-neutral-500'>Created At</label>
            <p className='font-medium'>
              {new Date(account.createdAt).toLocaleDateString()}
            </p>
          </div>

          <div>
            <label className='text-sm text-neutral-500'>Created By</label>
            <p className='font-medium'>{account.createdBy}</p>
          </div>

          {account.updatedAt && (
            <div>
              <label className='text-sm text-neutral-500'>Updated At</label>
              <p className='font-medium'>
                {new Date(account.updatedAt).toLocaleDateString()}
              </p>
            </div>
          )}

          {account.updatedBy && (
            <div>
              <label className='text-sm text-neutral-500'>Updated By</label>
              <p className='font-medium'>{account.updatedBy}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
