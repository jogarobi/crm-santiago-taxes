'use client';

import { use } from 'react';
import { useAccount } from '@/lib/hooks/use-accounts';
import {
  BriefcaseBusinessIcon,
  Building2Icon,
  Edit2Icon,
  IdCardIcon,
  Loader2,
  MailIcon,
  PhoneIcon,
  TrashIcon,
} from 'lucide-react';

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
    <div className='flex flex-col gap-8 pt-3'>
      <div className='flex items-center gap-8 bg-white border rounded-lg p-8'>
        <div className='text-3xl font-semibold h-20 w-20 rounded-full bg-purple text-white flex items-center justify-center'>
          {account.firstName[0] + account.lastName[0]}
        </div>

        <div className='flex flex-col gap-3'>
          <h1 className='text-2xl font-bold'>
            {account.firstName} {account.lastName}
          </h1>

          <div className='flex items-center gap-8'>
            <div className='flex gap-2 items-center'>
              <PhoneIcon size={16} className='inline-block' />
              <span className='text-[16px] text-neutral-500'>
                Not available
              </span>
            </div>
            <div className='flex gap-2 items-center'>
              <MailIcon size={16} className='inline-block' />
              <span className='text-[16px] text-neutral-500'>
                Not available
              </span>
            </div>

            {account.ssnLastFour && (
              <div className='flex gap-2 items-center'>
                <IdCardIcon size={18} className='inline-block' />
                <span className='text-[16px]'>
                  ***-**-{account.ssnLastFour}
                </span>
              </div>
            )}

            <div className='flex gap-2 items-center'>
              <Building2Icon size={18} className='inline-block' />
              <span className='text-[16px]'>No business associated</span>
            </div>
          </div>
        </div>

        <div className='ml-auto flex flex-col gap-3'>
          <div className='flex items-center gap-2'>
            <Edit2Icon size={15} strokeWidth={2.4} />
            <span className='text-[15px] font-medium'>Edit</span>
          </div>

          <div className='flex items-center gap-2'>
            <BriefcaseBusinessIcon size={15} strokeWidth={2.4} />
            <span className='text-[15px] font-medium'>Add Business</span>
          </div>

          <div className='text-red-700 flex items-center gap-2'>
            <TrashIcon size={15} strokeWidth={2.4} />
            <span className='text-[15px] font-medium'>Delete</span>
          </div>
        </div>
      </div>

      <div className='bg-white border rounded-lg p-6'>
        <div className='grid grid-cols-2 gap-6'>
          {account.address && (
            <div>
              <div className='text-sm text-neutral-500 flex items-center gap-1 mb-1'>
                <span>Address Line</span>
              </div>
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
          {account.ssnLastFour && (
            <div>
              <label className='text-sm text-neutral-500'>SSN (Last 4)</label>
              <p className='font-medium'>{account.ssnLastFour}</p>
            </div>
          )}
          <div>
            <label className='text-sm text-neutral-500'>Date of Birth</label>
            <p className='font-medium'>{account.dateOfBirth}</p>
          </div>

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
