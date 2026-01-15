'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Input } from './ui/input';
import { Loader2, SearchIcon, XIcon, UserIcon } from 'lucide-react';
import { useCreateNote } from '@/hooks/use-notes';
import { useAccounts } from '@/hooks/use-accounts';
import type { Account } from '@/lib/types/account';

interface CreateNoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accountId?: number;
  businessId?: number;
}

export function CreateNoteDialog({
  open,
  onOpenChange,
  accountId,
  businessId,
}: CreateNoteDialogProps) {
  const createNote = useCreateNote();
  const [content, setContent] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Search state
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [pageSize, setPageSize] = useState(10);

  // If we have a prop accountId, we can skip search.
  // But we might not have the account details to show title easily unless we fetch it,
  // or we just assume the user knows context.
  // For the global case, we need search.
  const isGlobalMode = !accountId;

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
      setPageSize(10);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchInput]);

  const { data: accountsData, isLoading: isLoadingAccounts } = useAccounts(
    isGlobalMode && debouncedSearch
      ? { search: debouncedSearch, pageSize }
      : undefined
  );

  const accounts = accountsData?.data || [];
  const totalCount = accountsData?.meta?.total || 0;
  const hasMore = accounts.length < totalCount;

  const handleSelectAccount = (account: Account) => {
    setSelectedAccount(account);
    setSearchInput('');
  };

  const handleClearSelection = () => {
    setSelectedAccount(null);
  };

  const handleLoadMore = () => {
    setPageSize((prev) => prev + 10);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const targetAccountId = accountId || selectedAccount?.id;

    if (!targetAccountId) {
      setError('Please select a client');
      return;
    }

    if (!content.trim()) {
      setError('Please enter note content');
      return;
    }

    try {
      await createNote.mutateAsync({
        accountId: targetAccountId,
        data: {
          content: content.trim(),
          createdBy: 'system', // TODO: Replace with actual user
          businessId: businessId,
        },
      });

      onOpenChange(false);
      setContent('');
      setSelectedAccount(null);
      setSearchInput('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleDialogOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setContent('');
      setError(null);
      if (isGlobalMode) {
        setSelectedAccount(null);
        setSearchInput('');
      }
    }
    onOpenChange(newOpen);
  };

  const renderSearchStep = () => (
    <div className='flex flex-col gap-4'>
      <div className='relative'>
        <SearchIcon className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400' />
        <Input
          placeholder='Search client by name...'
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className='pl-9'
          autoFocus
        />
      </div>

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

            {hasMore && (
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
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent className='max-w-xl'>
        <DialogHeader>
          <DialogTitle className='text-xl'>
            {isGlobalMode && !selectedAccount
              ? 'Select Client for Note'
              : 'Create New Note'}
          </DialogTitle>
        </DialogHeader>

        <div className='flex flex-col gap-4 mt-2'>
          {error && (
            <div className='bg-red-50 border border-red-200 rounded-lg p-3'>
              <p className='text-red-800 text-sm'>{error}</p>
            </div>
          )}

          {isGlobalMode && !selectedAccount ? (
            renderSearchStep()
          ) : (
            <form onSubmit={handleSubmit} className='flex flex-col gap-4'>
              {isGlobalMode && selectedAccount && (
                <div className='flex items-center justify-between p-3 bg-neutral-50 border rounded-lg'>
                  <div className='flex items-center gap-3'>
                    <div className='w-8 h-8 rounded-full bg-purple flex items-center justify-center text-white text-xs font-semibold'>
                      {selectedAccount.firstName[0]}
                      {selectedAccount.lastName[0]}
                    </div>
                    <div>
                      <p className='font-medium text-sm text-neutral-900'>
                        {selectedAccount.firstName} {selectedAccount.lastName}
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

              <div className='flex flex-col gap-2'>
                <Textarea
                  id='content'
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  required
                  placeholder='Enter your note here...'
                  className='min-h-32'
                  autoFocus
                />
              </div>

              <div className='flex gap-3 justify-end mt-2'>
                <Button
                  type='button'
                  variant='outline'
                  onClick={() => onOpenChange(false)}
                  disabled={createNote.isPending}
                >
                  Cancel
                </Button>
                <Button
                  type='submit'
                  className='bg-purple cursor-pointer'
                  disabled={createNote.isPending}
                >
                  {createNote.isPending ? (
                    <>
                      <Loader2 className='w-4 h-4 animate-spin mr-2' />
                      Creating...
                    </>
                  ) : (
                    'Create Note'
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
