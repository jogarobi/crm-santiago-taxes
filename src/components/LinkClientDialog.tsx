'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { InfoIcon, Loader2, SearchIcon } from 'lucide-react';
import { useAccounts } from '@/lib/hooks/use-accounts';
import type { Account } from '@/lib/types/account';

interface LinkClientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (accountId: number) => void;
  isLinking?: boolean;
  customerName?: string;
}

export function LinkClientDialog({
  open,
  onOpenChange,
  onSelect,
  isLinking,
  customerName,
}: LinkClientDialogProps) {
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [pageSize, setPageSize] = useState(10);
  const [confirmAccount, setConfirmAccount] = useState<Account | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
      setPageSize(10); // Reset page size when search changes
    }, 500);

    return () => clearTimeout(timer);
  }, [searchInput]);

  const { data: accountsData, isLoading } = useAccounts(
    debouncedSearch ? { search: debouncedSearch, pageSize } : undefined
  );

  const accounts = accountsData?.data || [];
  const totalCount = accountsData?.meta?.total || 0;
  const hasMore = accounts.length < totalCount;

  const handleSelectClick = (account: Account) => {
    setConfirmAccount(account);
  };

  const handleConfirm = () => {
    if (confirmAccount) {
      onSelect(confirmAccount.id);
      setConfirmAccount(null);
    }
  };

  const handleLoadMore = () => {
    setPageSize((prev) => prev + 10);
  };

  const handleDialogOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setSearchInput('');
      setDebouncedSearch('');
      setPageSize(10);
      setConfirmAccount(null);
    }
    onOpenChange(newOpen);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleDialogOpenChange}>
        <DialogContent className='max-w-lg'>
          <DialogHeader>
            <DialogTitle className='text-xl'>
              Link to Existing Client
            </DialogTitle>
          </DialogHeader>

          <div className='flex gap-3 border p-4 rounded-lg'>
            <InfoIcon className='w-5 text-yellow-600' strokeWidth={2.4} />

            <div>
              <p className='text-sm font-medium text-yellow-600'>
                By doing this, you are linking customer {customerName} from
                Square to the selected client on the CRM.
              </p>
            </div>
          </div>

          <div className='flex flex-col gap-4 mt-2'>
            <div className='relative'>
              <SearchIcon className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400' />
              <Input
                placeholder='Search by name...'
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className='pl-9'
                autoFocus
              />
            </div>

            <div className='flex flex-col gap-1 max-h-[300px] overflow-y-auto'>
              {isLoading && accounts.length === 0 ? (
                <div className='flex items-center justify-center py-8'>
                  <Loader2 className='w-5 h-5 animate-spin text-neutral-400' />
                </div>
              ) : accounts.length === 0 ? (
                <div className='text-center py-8 text-neutral-500 text-sm'>
                  {debouncedSearch
                    ? 'No clients found'
                    : 'Start typing to search'}
                </div>
              ) : (
                <>
                  {accounts.map((account) => (
                    <div
                      key={account.id}
                      className='flex items-center gap-3 p-3 rounded-lg hover:bg-neutral-100 transition-colors text-left'
                    >
                      <div className='flex-1'>
                        <p className='font-medium text-neutral-900'>
                          {account.firstName} {account.lastName}
                        </p>
                        <p className='text-sm text-neutral-500'>
                          SSN L4: {account.ssnLastFour || 'N/A'}
                        </p>
                      </div>
                      <Button
                        size='sm'
                        variant='outline'
                        disabled={isLinking}
                        onClick={() => handleSelectClick(account)}
                      >
                        Select
                      </Button>
                    </div>
                  ))}

                  {hasMore && (
                    <Button
                      variant='ghost'
                      className='mt-2'
                      onClick={handleLoadMore}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <Loader2 className='w-4 h-4 animate-spin mr-2' />
                      ) : null}
                      Load more
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!confirmAccount}
        onOpenChange={(open) => !open && setConfirmAccount(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Link</AlertDialogTitle>
            <AlertDialogDescription className='text-neutral-600 text-[15px]'>
              Are you sure you want to link customer{' '}
              <span className='font-semibold'>{customerName}</span> from Square
              to{' '}
              <span className='font-semibold'>
                {confirmAccount?.firstName} {confirmAccount?.lastName}
              </span>{' '}
              in the CRM?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLinking}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm} disabled={isLinking}>
              {isLinking ? (
                <>
                  <Loader2 className='w-4 h-4 animate-spin mr-2' />
                  Linking...
                </>
              ) : (
                'Confirm'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
