'use client';

import { useState, useEffect } from 'react';
import { useAccounts } from '@/lib/hooks/use-accounts';
import {
  InputGroup,
  InputGroupInput,
  InputGroupAddon,
} from '@/components/ui/input-group';
import { Search, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Badge } from './ui/badge';

export function SearchAccounts() {
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
    }, 200);

    return () => clearTimeout(timer);
  }, [searchInput]);

  const { data: response, isLoading } = useAccounts(
    debouncedSearch ? { search: debouncedSearch } : undefined
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchInput(value);
    setIsOpen(value.length > 0);
  };

  const handleResultClick = () => {
    setSearchInput('');
    setIsOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.search-container')) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredAccounts = debouncedSearch && response?.data ? response.data : undefined;

  return (
    <div className='relative search-container'>
      <InputGroup className='py-6 bg-white'>
        <InputGroupInput
          placeholder='Search client...'
          value={searchInput}
          onChange={handleInputChange}
          onFocus={() => searchInput.length > 0 && setIsOpen(true)}
        />
        <InputGroupAddon>
          {isLoading && debouncedSearch ? (
            <Loader2 className='animate-spin' />
          ) : (
            <Search />
          )}
        </InputGroupAddon>
      </InputGroup>

      {isOpen && debouncedSearch && (
        <div className='absolute top-full left-0 right-0 mt-2 bg-white border rounded-lg shadow-lg max-h-96 overflow-y-auto z-50'>
          {isLoading ? (
            <div className='p-4 text-center text-sm text-neutral-500'>
              Searching...
            </div>
          ) : filteredAccounts && filteredAccounts.length > 0 ? (
            <div className='py-2'>
              <div className='px-4 py-2 text-sm text-neutral-500 font-medium'>
                {filteredAccounts.length} result
                {filteredAccounts.length !== 1 ? 's' : ''} found
              </div>
              {filteredAccounts.map((account) => (
                <Link
                  key={account.id}
                  href={`/clients/${account.id}`}
                  onClick={handleResultClick}
                  className='block px-4 py-4 hover:bg-neutral-50 transition-colors border-b last:border-b-0'
                >
                  <div className='flex items-center justify-between'>
                    <div>
                      <div className='flex items-center gap-3'>
                        <p className='font-medium text-[15px] text-neutral-900'>
                          {account.firstName} {account.lastName}
                        </p>

                        <div className='text-sm text-neutral-500'>
                          {account.ssnLastFour && (
                            <Badge
                              variant='secondary'
                              className='font-semibold'
                            >
                              L4 SSN: {account.ssnLastFour}
                            </Badge>
                          )}
                        </div>
                      </div>
                      {account.address && (
                        <p className='text-[13px] text-neutral-600 mt-2'>
                          {account.address}
                          {account.city && `, ${account.city}`}
                          {account.state && `, ${account.state}`}
                        </p>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className='p-4 text-center text-neutral-500'>
              No accounts found for &quot;{debouncedSearch}&quot;
            </div>
          )}
        </div>
      )}
    </div>
  );
}
