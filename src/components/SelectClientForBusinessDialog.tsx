'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { useAccounts } from '@/hooks/use-accounts';
import {
  InputGroup,
  InputGroupInput,
  InputGroupAddon,
} from '@/components/ui/input-group';
import { Search, Loader2, UserIcon } from 'lucide-react';
import { Badge } from './ui/badge';

interface SelectClientForBusinessDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClientSelected: (accountId: number) => void;
}

export function SelectClientForBusinessDialog({
  open,
  onOpenChange,
  onClientSelected,
}: SelectClientForBusinessDialogProps) {
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchInput]);

  const { data: response, isLoading } = useAccounts({
    search: debouncedSearch || undefined,
    pageSize: 50,
  });

  const accounts = response?.data || [];

  const handleSelectClient = (accountId: number) => {
    onClientSelected(accountId);
    setSearchInput('');
    onOpenChange(false);
  };

  const handleDialogOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setSearchInput('');
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent className='max-w-2xl'>
        <DialogHeader>
          <DialogTitle className='text-xl'>
            Select Client for Business
          </DialogTitle>
        </DialogHeader>

        <div className='flex flex-col gap-4 mt-4'>
          <p className='text-sm text-neutral-600'>
            Search for and select a client to add a business to their account.
          </p>

          <InputGroup className='py-4 bg-white'>
            <InputGroupInput
              placeholder='Search by client name, SSN, or ID...'
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              autoFocus
            />
            <InputGroupAddon>
              {isLoading ? <Loader2 className='animate-spin' /> : <Search />}
            </InputGroupAddon>
          </InputGroup>

          <div className='max-h-96 overflow-y-auto border rounded-lg'>
            {isLoading && (
              <div className='flex items-center justify-center py-12'>
                <Loader2 className='w-6 h-6 animate-spin text-purple' />
                <span className='ml-3 text-sm text-neutral-600'>
                  Searching...
                </span>
              </div>
            )}

            {!isLoading && accounts.length === 0 && (
              <div className='flex flex-col items-center justify-center py-12'>
                <UserIcon
                  className='w-8 h-8 text-neutral-400 mb-3'
                  strokeWidth={1.8}
                />
                <p className='text-sm text-neutral-500'>
                  {searchInput
                    ? `No clients found for "${searchInput}"`
                    : 'Start typing to search for clients'}
                </p>
              </div>
            )}

            {!isLoading && accounts.length > 0 && (
              <div className='divide-y'>
                {accounts.map((account) => (
                  <button
                    key={account.id}
                    onClick={() => handleSelectClient(account.id)}
                    className='w-full px-4 py-4 hover:bg-neutral-50 transition-colors text-left'
                  >
                    <div className='flex items-center justify-between'>
                      <div className='w-full'>
                        <div className='flex items-center gap-3'>
                          <p className='font-medium text-[15px] text-neutral-900'>
                            {account.firstName} {account.lastName}
                          </p>
                          {account.ssnLastFour && (
                            <Badge variant='secondary' className='font-semibold'>
                              SSN: {account.ssnLastFour}
                            </Badge>
                          )}
                        </div>
                        {account.businesses && account.businesses.length > 0 && (
                          <p className='text-sm text-purple font-medium mt-1.5'>
                            {account.businesses.length === 1
                              ? 'Business: '
                              : 'Businesses: '}
                            {account.businesses
                              .map((b) => b.registeredName)
                              .join(', ')}
                          </p>
                        )}
                        {account.address && (
                          <p className='text-[13px] text-neutral-600 mt-2'>
                            {account.address}
                            {account.city && `, ${account.city}`}
                            {account.state && `, ${account.state}`}
                          </p>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className='flex justify-end pt-4 border-t'>
            <Button
              type='button'
              variant='outline'
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
