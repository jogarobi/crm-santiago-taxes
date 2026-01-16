'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Loader2, SearchIcon } from 'lucide-react';
import { useAccounts } from '@/hooks/use-accounts';
import { useCreateAccountRelationship } from '@/hooks/use-account-relationships';
import type { Account } from '@/lib/types/account';

interface AddRelationshipDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accountId: number;
}

const RELATIONSHIP_TYPES = [
  'Spouse',
  'Child',
  'Parent',
  'Sibling',
  'Partner',
  'Dependent',
  'Other',
];

export function AddRelationshipDialog({
  open,
  onOpenChange,
  accountId,
}: AddRelationshipDialogProps) {
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [pageSize, setPageSize] = useState(10);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [relationshipType, setRelationshipType] = useState('');
  const [error, setError] = useState<string | null>(null);

  const createRelationship = useCreateAccountRelationship();

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
      setPageSize(10);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchInput]);

  const { data: accountsData, isLoading } = useAccounts(
    debouncedSearch ? { search: debouncedSearch, pageSize } : undefined
  );

  const accounts = accountsData?.data || [];
  const totalCount = accountsData?.meta?.total || 0;
  const hasMore = accounts.length < totalCount;

  const handleSelectAccount = (account: Account) => {
    setSelectedAccount(account);
    setError(null);
  };

  const handleLoadMore = () => {
    setPageSize((prev) => prev + 10);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedAccount) {
      setError('Please select an account');
      return;
    }

    if (!relationshipType) {
      setError('Please enter a relationship type');
      return;
    }

    if (selectedAccount.id === accountId) {
      setError('Cannot create a relationship with the same account');
      return;
    }

    try {
      await createRelationship.mutateAsync({
        accountId,
        relatedAccountId: selectedAccount.id,
        relationship: relationshipType,
        createdBy: 'system',
      });

      onOpenChange(false);
      setSelectedAccount(null);
      setRelationshipType('');
      setSearchInput('');
      setDebouncedSearch('');
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to create relationship'
      );
    }
  };

  const handleDialogOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setSearchInput('');
      setDebouncedSearch('');
      setPageSize(10);
      setSelectedAccount(null);
      setRelationshipType('');
      setError(null);
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent className='max-w-lg'>
        <DialogHeader>
          <DialogTitle className='text-xl'>Add Relationship</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className='flex flex-col gap-5 mt-4'>
          {error && (
            <div className='bg-red-50 border border-red-200 rounded-lg p-3'>
              <p className='text-red-800 text-sm'>{error}</p>
            </div>
          )}

          <div className='flex flex-col gap-2'>
            <Label htmlFor='relationship-type' className='text-sm font-medium'>
              Relationship Type <span className='text-red-500'>*</span>
            </Label>
            <div className='flex flex-wrap gap-2'>
              {RELATIONSHIP_TYPES.map((type) => (
                <button
                  key={type}
                  type='button'
                  onClick={() => setRelationshipType(type)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    relationshipType === type
                      ? 'bg-purple text-white'
                      : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
            <Input
              id='relationship-type'
              placeholder='Or type custom relationship...'
              value={relationshipType}
              onChange={(e) => setRelationshipType(e.target.value)}
              className='mt-2 p-3'
            />
          </div>

          <div className='flex flex-col gap-2'>
            <Label htmlFor='search-account' className='text-sm font-medium'>
              Select Related Account <span className='text-red-500'>*</span>
            </Label>
            <div className='relative'>
              <SearchIcon className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400' />
              <Input
                id='search-account'
                placeholder='Search by name...'
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className='pl-9'
              />
            </div>

            {selectedAccount && (
              <div className='p-3 bg-purple/10 border border-purple/30 rounded-lg'>
                <div className='flex items-center justify-between'>
                  <div>
                    <p className='font-medium text-neutral-900'>
                      {selectedAccount.firstName} {selectedAccount.lastName}
                    </p>
                    <p className='text-sm text-neutral-500'>
                      DOB: {selectedAccount.dateOfBirth}
                    </p>
                  </div>
                  <Button
                    type='button'
                    size='sm'
                    variant='ghost'
                    onClick={() => setSelectedAccount(null)}
                  >
                    Change
                  </Button>
                </div>
              </div>
            )}

            {!selectedAccount && (
              <div className='flex flex-col gap-1 max-h-[250px] overflow-y-auto border rounded-lg p-2'>
                {isLoading && accounts.length === 0 ? (
                  <div className='flex items-center justify-center py-8'>
                    <Loader2 className='w-5 h-5 animate-spin text-neutral-400' />
                  </div>
                ) : accounts.length === 0 ? (
                  <div className='text-center py-8 text-neutral-500 text-sm'>
                    {debouncedSearch
                      ? 'No accounts found'
                      : 'Start typing to search'}
                  </div>
                ) : (
                  <>
                    {accounts.map((account) => {
                      if (account.id === accountId) return null;

                      const dob = account.dateOfBirth
                        ? new Date(account.dateOfBirth)
                        : null;
                      const formattedDob = dob
                        ? dob.toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })
                        : 'N/A';

                      return (
                        <div
                          key={account.id}
                          className='flex items-center gap-3 p-3 rounded-lg hover:bg-neutral-100 transition-colors cursor-pointer'
                          onClick={() => handleSelectAccount(account)}
                        >
                          <div className='flex-1'>
                            <p className='font-medium text-neutral-900'>
                              {account.firstName} {account.lastName}
                            </p>
                            <div className='flex items-center gap-3 text-sm text-neutral-500'>
                              <span>
                                SSN L4: {account.ssnLastFour || 'N/A'}
                              </span>
                              <span>•</span>
                              <span>DOB: {formattedDob}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {hasMore && (
                      <Button
                        type='button'
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
            )}
          </div>

          <div className='flex gap-3 justify-end mt-4 pt-4 border-t'>
            <Button
              type='button'
              variant='outline'
              onClick={() => onOpenChange(false)}
              disabled={createRelationship.isPending}
            >
              Cancel
            </Button>
            <Button
              type='submit'
              className='cursor-pointer'
              disabled={createRelationship.isPending}
            >
              {createRelationship.isPending ? (
                <>
                  <Loader2 className='w-4 h-4 animate-spin mr-2' />
                  Adding...
                </>
              ) : (
                'Add Relationship'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
