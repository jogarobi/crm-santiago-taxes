'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Input } from './ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Loader2, SearchIcon, UserIcon, Building2Icon } from 'lucide-react';
import { useCreateTask } from '@/hooks/use-tasks';
import { useStaff } from '@/hooks/use-staff';
import { useAccounts } from '@/hooks/use-accounts';
import { useAllBusinesses } from '@/hooks/use-businesses';
import { authClient } from '@/app/api/clients';
import type { Account } from '@/lib/types/account';
import type { Business } from '@/lib/types/business';

interface CreateTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accountId?: number;
  businessId?: number;
}

type LinkType = 'none' | 'client' | 'business';

export function CreateTaskDialog({
  open,
  onOpenChange,
  accountId: propAccountId,
  businessId: propBusinessId,
}: CreateTaskDialogProps) {
  const createTask = useCreateTask();
  const { data: session } = authClient.useSession();
  const { data: staffResponse, isLoading: isLoadingStaff } = useStaff({
    pageSize: 100,
  });

  const [content, setContent] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Link type selection
  const [linkType, setLinkType] = useState<LinkType>('none');
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(
    null
  );

  // Search state
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [pageSize, setPageSize] = useState(10);

  // Check if we're in context mode (props provided)
  const isContextMode = !!propAccountId || !!propBusinessId;

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
      setPageSize(10);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchInput]);

  // Fetch accounts for search
  const { data: accountsData, isLoading: isLoadingAccounts } = useAccounts(
    linkType === 'client' && debouncedSearch && !isContextMode
      ? { search: debouncedSearch, pageSize }
      : undefined
  );

  // Fetch businesses for search
  const { data: businessesData, isLoading: isLoadingBusinesses } =
    useAllBusinesses(
      linkType === 'business' && debouncedSearch && !isContextMode
        ? { search: debouncedSearch, pageSize }
        : undefined
    );

  const staffMembers = staffResponse?.data || [];
  const accounts = accountsData?.data || [];
  const businesses = businessesData?.data || [];
  const accountsTotal = accountsData?.meta?.total || 0;
  const businessesTotal = businessesData?.meta?.total || 0;
  const hasMoreAccounts = accounts.length < accountsTotal;
  const hasMoreBusinesses = businesses.length < businessesTotal;

  const handleSelectAccount = (account: Account) => {
    setSelectedAccount(account);
    setSearchInput('');
  };

  const handleSelectBusiness = (business: Business) => {
    setSelectedBusiness(business);
    setSearchInput('');
  };

  const handleClearSelection = () => {
    setSelectedAccount(null);
    setSelectedBusiness(null);
    setSearchInput('');
  };

  const handleLoadMore = () => {
    setPageSize((prev) => prev + 10);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!content.trim()) {
      setError('Please enter task description');
      return;
    }

    if (!session?.user?.id) {
      setError('You must be logged in to create a task');
      return;
    }

    // Determine the final accountId and businessId
    // Rule: Tasks can be linked to EITHER accountId OR businessId OR neither, NOT both
    let finalAccountId: number | undefined;
    let finalBusinessId: number | undefined;

    if (isContextMode) {
      // Use props if provided (from detail pages)
      // If businessId is provided, only use businessId (not both)
      if (propBusinessId) {
        finalBusinessId = propBusinessId;
      } else if (propAccountId) {
        finalAccountId = propAccountId;
      }
    } else {
      // Use selected values from search
      if (linkType === 'client' && selectedAccount) {
        finalAccountId = selectedAccount.id;
      } else if (linkType === 'business' && selectedBusiness) {
        finalBusinessId = selectedBusiness.id;
        // Do NOT include accountId when businessId is selected
      }
    }

    try {
      await createTask.mutateAsync({
        content: content.trim(),
        status: 'todo',
        assignedTo: assignedTo.trim() || undefined,
        createdBy: session.user.id,
        accountId: finalAccountId,
        businessId: finalBusinessId,
      });

      onOpenChange(false);
      setContent('');
      setAssignedTo('');
      setLinkType('none');
      setSelectedAccount(null);
      setSelectedBusiness(null);
      setSearchInput('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleDialogOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setContent('');
      setAssignedTo('');
      setError(null);
      setLinkType('none');
      setSelectedAccount(null);
      setSelectedBusiness(null);
      setSearchInput('');
    }
    onOpenChange(newOpen);
  };

  const renderSearchResults = () => {
    if (linkType === 'client') {
      return (
        <div className='flex flex-col gap-1 max-h-[300px] overflow-y-auto min-h-[100px]'>
          {isLoadingAccounts && accounts.length === 0 ? (
            <div className='flex items-center justify-center py-8'>
              <Loader2 className='w-5 h-5 animate-spin text-neutral-400' />
            </div>
          ) : accounts.length === 0 ? (
            <div className='text-center py-8 text-neutral-500 text-sm'>
              {debouncedSearch ? 'No clients found' : 'Start typing to search'}
            </div>
          ) : (
            <>
              {accounts.map((account) => (
                <div
                  key={account.id}
                  className='flex items-center justify-between p-3 rounded-lg hover:bg-neutral-100 transition-colors cursor-pointer group'
                  onClick={() => handleSelectAccount(account)}
                >
                  <div className='flex items-center gap-3'>
                    <div className='w-8 h-8 rounded-full bg-purple/10 flex items-center justify-center text-purple text-xs font-semibold'>
                      {account.firstName[0]}
                      {account.lastName[0]}
                    </div>
                    <div>
                      <p className='font-medium text-sm text-neutral-900'>
                        {account.firstName} {account.lastName}
                      </p>
                      <p className='text-xs text-neutral-500'>
                        SSN: {account.ssnLastFour || 'N/A'}
                      </p>
                    </div>
                  </div>
                  <Button
                    size='sm'
                    variant='ghost'
                    className='opacity-0 group-hover:opacity-100 h-8'
                    type='button'
                  >
                    Select
                  </Button>
                </div>
              ))}

              {hasMoreAccounts && (
                <Button
                  variant='ghost'
                  className='mt-2 w-full text-xs'
                  onClick={handleLoadMore}
                  disabled={isLoadingAccounts}
                  type='button'
                >
                  {isLoadingAccounts ? (
                    <Loader2 className='w-3 h-3 animate-spin mr-2' />
                  ) : null}
                  Load more
                </Button>
              )}
            </>
          )}
        </div>
      );
    } else if (linkType === 'business') {
      return (
        <div className='flex flex-col gap-1 max-h-[300px] overflow-y-auto min-h-[100px]'>
          {isLoadingBusinesses && businesses.length === 0 ? (
            <div className='flex items-center justify-center py-8'>
              <Loader2 className='w-5 h-5 animate-spin text-neutral-400' />
            </div>
          ) : businesses.length === 0 ? (
            <div className='text-center py-8 text-neutral-500 text-sm'>
              {debouncedSearch
                ? 'No businesses found'
                : 'Start typing to search'}
            </div>
          ) : (
            <>
              {businesses.map((business) => (
                <div
                  key={business.id}
                  className='flex items-center justify-between p-3 rounded-lg hover:bg-neutral-100 transition-colors cursor-pointer group'
                  onClick={() => handleSelectBusiness(business)}
                >
                  <div className='flex items-center gap-3'>
                    <div className='w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700'>
                      <Building2Icon size={16} />
                    </div>
                    <div>
                      <p className='font-medium text-sm text-neutral-900'>
                        {business.registeredName}
                      </p>
                      <p className='text-xs text-neutral-500'>
                        {business.entity?.name || 'Business'} • Owner:{' '}
                        {business.account
                          ? `${business.account.firstName} ${business.account.lastName}`
                          : 'N/A'}
                      </p>
                    </div>
                  </div>
                  <Button
                    size='sm'
                    variant='ghost'
                    className='opacity-0 group-hover:opacity-100 h-8'
                    type='button'
                  >
                    Select
                  </Button>
                </div>
              ))}

              {hasMoreBusinesses && (
                <Button
                  variant='ghost'
                  className='mt-2 w-full text-xs'
                  onClick={handleLoadMore}
                  disabled={isLoadingBusinesses}
                  type='button'
                >
                  {isLoadingBusinesses ? (
                    <Loader2 className='w-3 h-3 animate-spin mr-2' />
                  ) : null}
                  Load more
                </Button>
              )}
            </>
          )}
        </div>
      );
    }
    return null;
  };

  const showLinkTypeSelection =
    !isContextMode &&
    linkType !== 'none' &&
    !selectedAccount &&
    !selectedBusiness;

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent className='max-w-xl'>
        <DialogHeader>
          <DialogTitle className='text-xl'>
            {showLinkTypeSelection
              ? linkType === 'client'
                ? 'Select Client for Task'
                : 'Select Business for Task'
              : 'Create New Task'}
          </DialogTitle>
        </DialogHeader>

        <div className='flex flex-col gap-4 mt-2'>
          {error && (
            <div className='bg-red-50 border border-red-200 rounded-lg p-3'>
              <p className='text-red-800 text-sm'>{error}</p>
            </div>
          )}

          {showLinkTypeSelection ? (
            <>
              <div className='relative'>
                <SearchIcon className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400' />
                <Input
                  placeholder={
                    linkType === 'client'
                      ? 'Search client by name...'
                      : 'Search business by name...'
                  }
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className='pl-9'
                  autoFocus
                />
              </div>
              {renderSearchResults()}
              <Button
                type='button'
                variant='outline'
                onClick={() => {
                  setLinkType('none');
                  setSearchInput('');
                }}
                className='w-full'
              >
                Back
              </Button>
            </>
          ) : (
            <form onSubmit={handleSubmit} className='flex flex-col gap-4'>
              {!isContextMode && (
                <>
                  <div className='flex flex-col gap-2'>
                    <Label htmlFor='linkType'>Link to (Optional)</Label>
                    <Select
                      value={linkType}
                      onValueChange={(value: LinkType) => {
                        setLinkType(value);
                        setSelectedAccount(null);
                        setSelectedBusiness(null);
                      }}
                    >
                      <SelectTrigger id='linkType'>
                        <SelectValue placeholder='Select link type...' />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='none'>None (General Task)</SelectItem>
                        <SelectItem value='client'>Client Account</SelectItem>
                        <SelectItem value='business'>Business</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedAccount && (
                    <div className='flex items-center justify-between p-3 bg-neutral-50 border rounded-lg'>
                      <div className='flex items-center gap-3'>
                        <div className='w-8 h-8 rounded-full bg-purple flex items-center justify-center text-white text-xs font-semibold'>
                          {selectedAccount.firstName[0]}
                          {selectedAccount.lastName[0]}
                        </div>
                        <div>
                          <p className='font-medium text-sm text-neutral-900'>
                            {selectedAccount.firstName}{' '}
                            {selectedAccount.lastName}
                          </p>
                          <div className='flex items-center gap-2 text-xs text-neutral-500'>
                            <UserIcon size={12} />
                            <span>Client</span>
                          </div>
                        </div>
                      </div>
                      <Button
                        type='button'
                        variant='ghost'
                        size='sm'
                        className='h-8 text-neutral-500 hover:text-neutral-700'
                        onClick={handleClearSelection}
                      >
                        Change
                      </Button>
                    </div>
                  )}

                  {selectedBusiness && (
                    <div className='flex items-center justify-between p-3 bg-neutral-50 border rounded-lg'>
                      <div className='flex items-center gap-3'>
                        <div className='w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700'>
                          <Building2Icon size={16} />
                        </div>
                        <div>
                          <p className='font-medium text-sm text-neutral-900'>
                            {selectedBusiness.registeredName}
                          </p>
                          <div className='flex items-center gap-2 text-xs text-neutral-500'>
                            <Building2Icon size={12} />
                            <span>Business</span>
                          </div>
                        </div>
                      </div>
                      <Button
                        type='button'
                        variant='ghost'
                        size='sm'
                        className='h-8 text-neutral-500 hover:text-neutral-700'
                        onClick={handleClearSelection}
                      >
                        Change
                      </Button>
                    </div>
                  )}
                </>
              )}

              <div className='flex flex-col gap-2'>
                <Label htmlFor='content'>Task Description</Label>
                <Textarea
                  id='content'
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  required
                  placeholder='Enter task description...'
                  className='min-h-32'
                  autoFocus={isContextMode}
                />
              </div>

              <div className='flex flex-col gap-2'>
                <Label htmlFor='assignedTo'>Assign To (Optional)</Label>
                <Select value={assignedTo} onValueChange={setAssignedTo}>
                  <SelectTrigger id='assignedTo'>
                    <SelectValue placeholder='Select a staff member...' />
                  </SelectTrigger>
                  <SelectContent>
                    {isLoadingStaff ? (
                      <div className='flex items-center justify-center py-4'>
                        <Loader2 className='h-4 w-4 animate-spin text-neutral-400' />
                      </div>
                    ) : staffMembers.length === 0 ? (
                      <div className='text-center py-4 text-sm text-neutral-500'>
                        No staff members found
                      </div>
                    ) : (
                      staffMembers.map((staff) => (
                        <SelectItem key={staff.id} value={staff.id.toString()}>
                          {staff.firstName} {staff.lastName}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className='flex gap-3 justify-end mt-2'>
                <Button
                  type='button'
                  variant='outline'
                  onClick={() => onOpenChange(false)}
                  disabled={createTask.isPending}
                >
                  Cancel
                </Button>
                <Button
                  type='submit'
                  className='bg-purple cursor-pointer'
                  disabled={createTask.isPending}
                >
                  {createTask.isPending ? (
                    <>
                      <Loader2 className='w-4 h-4 animate-spin mr-2' />
                      Creating...
                    </>
                  ) : (
                    'Create Task'
                  )}
                </Button>
              </div>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
