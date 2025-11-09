'use client';

import { use } from 'react';
import { useAccount } from '@/lib/hooks/use-accounts';
import {
  Building2Icon,
  ClockIcon,
  Edit2Icon,
  IdCardIcon,
  Loader2,
  MailIcon,
  PhoneIcon,
  PlusIcon,
  TrashIcon,
} from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';

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
      <div className='flex items-center gap-8 bg-white border rounded-xl p-8'>
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
                <span className='text-[16px]'>{account.ssnLastFour}</span>
              </div>
            )}

            <div className='flex gap-2 items-center'>
              <Building2Icon size={18} className='inline-block' />
              <span className='text-[16px]'>No business associated</span>
            </div>
          </div>

          <div className='flex gap-2 items-center pt-1'>
            <ClockIcon size={16} className='inline-block' />
            <span className='text-[15px]'>
              Last interaction on {new Date().toLocaleString()}
            </span>
          </div>
        </div>

        <div className='ml-auto flex gap-5'>
          <div className='flex items-center gap-2'>
            <Edit2Icon size={15} strokeWidth={2.4} />
            <span className='text-[15px] font-medium'>Edit</span>
          </div>

          <div className='text-red-700 flex items-center gap-2'>
            <TrashIcon size={15} strokeWidth={2.4} />
            <span className='text-[15px] font-medium'>Delete</span>
          </div>
        </div>
      </div>

      <Tabs defaultValue='overview' className='w-full'>
        <TabsList className='mb-5 py-7 px-2 gap-2 w-full'>
          <TabsTrigger className='py-5' value='activity-overview'>
            Overview & Activity
          </TabsTrigger>
          <TabsTrigger className='py-5' value='appointments'>
            Appointments
          </TabsTrigger>
          <TabsTrigger className='py-5' value='tasks'>
            Tasks
          </TabsTrigger>
          <TabsTrigger className='py-5' value='businesses'>
            Businesses
          </TabsTrigger>
          <TabsTrigger className='py-5' value='relationships'>
            Relationships
          </TabsTrigger>
        </TabsList>

        <TabsContent value='activity-overview' className='flex gap-8'>
          <div className='bg-white border rounded-lg p-6 flex-2 flex flex-col gap-6'>
            <div className='flex items-center justify-between'>
              <h3 className='text-lg font-semibold'>Activity</h3>
              <Button className='bg-purple'>
                <span>New</span>
                <PlusIcon />
              </Button>
            </div>
            <div className='grid grid-cols-2 gap-6'></div>
          </div>
          <div className='bg-white border rounded-lg flex-1 p-6 w-full flex flex-col gap-6'>
            <h3 className='text-lg font-semibold'>Details</h3>
            <div className='grid grid-cols-2 gap-6'>
              {account.address && (
                <div>
                  <div className='text-sm text-neutral-500 flex items-center gap-1 mb-1'>
                    <span>Address Line</span>
                  </div>
                  <p className='font-medium text-[15px]'>{account.address}</p>
                </div>
              )}

              {account.city && (
                <div>
                  <label className='text-sm text-neutral-500'>City</label>
                  <p className='font-medium text-[15px]'>{account.city}</p>
                </div>
              )}

              {account.state && (
                <div>
                  <label className='text-sm text-neutral-500'>State</label>
                  <p className='font-medium text-[15px]'>{account.state}</p>
                </div>
              )}

              {account.zipCode && (
                <div>
                  <label className='text-sm text-neutral-500'>Zip Code</label>
                  <p className='font-medium text-[15px]'>{account.zipCode}</p>
                </div>
              )}

              {account.squareId && (
                <div>
                  <label className='text-sm text-neutral-500'>Square ID</label>
                  <p className='font-medium text-[15px]'>{account.squareId}</p>
                </div>
              )}
              {account.ssnLastFour && (
                <div>
                  <label className='text-sm text-neutral-500'>
                    SSN (Last 4)
                  </label>
                  <p className='font-medium text-[15px]'>
                    {account.ssnLastFour}
                  </p>
                </div>
              )}
              <div>
                <label className='text-sm text-neutral-500'>
                  Date of Birth
                </label>
                <p className='font-medium text-[15px]'>{account.dateOfBirth}</p>
              </div>

              <div>
                <label className='text-sm text-neutral-500'>Created At</label>
                <p className='font-medium text-[15px]'>
                  {new Date(account.createdAt).toLocaleDateString()}
                </p>
              </div>

              <div>
                <label className='text-sm text-neutral-500'>Created By</label>
                <p className='font-medium text-[15px]'>{account.createdBy}</p>
              </div>

              {account.updatedAt && (
                <div>
                  <label className='text-sm text-neutral-500'>Updated At</label>
                  <p className='font-medium text-[15px]'>
                    {new Date(account.updatedAt).toLocaleDateString()}
                  </p>
                </div>
              )}

              {account.updatedBy && (
                <div>
                  <label className='text-sm text-neutral-500'>Updated By</label>
                  <p className='font-medium text-[15px]'>{account.updatedBy}</p>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value='documents'>
          <div className='bg-white border rounded-lg p-6'>
            <p className='text-neutral-500'>Documents content coming soon...</p>
          </div>
        </TabsContent>

        <TabsContent value='appointments'>
          <div className='bg-white border rounded-lg p-6'>
            <p className='text-neutral-500'>
              Appointments content coming soon...
            </p>
          </div>
        </TabsContent>

        <TabsContent value='businesses'>
          <div className='bg-white border rounded-lg p-6'>
            <p className='text-neutral-500'>
              Businesses content coming soon...
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
