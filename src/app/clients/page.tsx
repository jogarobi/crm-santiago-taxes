'use client';

import { useState, useEffect } from 'react';
import { useAccounts } from '@/lib/hooks/use-accounts';
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
  PlusIcon,
  UsersIcon,
  ChevronLeft,
  ChevronRight,
  Search,
} from 'lucide-react';
import {
  InputGroup,
  InputGroupInput,
  InputGroupAddon,
} from '@/components/ui/input-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';

export default function ClientsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());

  // Set document title
  useEffect(() => {
    document.title = 'Clients | Santiago Taxes CRM';
  }, []);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPageIndex(0); // Reset to first page on search
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const {
    data: response,
    isLoading,
    error,
  } = useAccounts({
    search: debouncedSearch || undefined,
    pageSize,
    pageIndex,
  });

  const accounts = response?.data || [];
  const meta = response?.meta;

  // Clear selection when page changes
  useEffect(() => {
    // Intentionally clearing selection when pagination or search changes
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelectedRows(new Set());
  }, [pageIndex, pageSize, debouncedSearch]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Selection handlers
  const toggleRowSelection = (accountId: number) => {
    const newSelection = new Set(selectedRows);
    if (newSelection.has(accountId)) {
      newSelection.delete(accountId);
    } else {
      newSelection.add(accountId);
    }
    setSelectedRows(newSelection);
  };

  const toggleSelectAll = () => {
    if (selectedRows.size === accounts.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(accounts.map((account) => account.id)));
    }
  };

  const isAllSelected =
    accounts.length > 0 && selectedRows.size === accounts.length;
  const isSomeSelected = selectedRows.size > 0 && !isAllSelected;

  return (
    <div className='flex flex-col gap-6'>
      <div className='flex items-center justify-between'>
        <h1 className='text-2xl font-semibold'>Clients</h1>
        <Button className='bg-purple'>
          <PlusIcon className='w-4 h-4' />
          <span>New Client</span>
        </Button>
      </div>

      <InputGroup className='py-6 bg-white'>
        <InputGroupInput
          placeholder='Search by name, SSN last 4 digits, or ID...'
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <InputGroupAddon>
          <Search />
        </InputGroupAddon>
      </InputGroup>

      {isLoading && (
        <div className='flex items-center justify-center py-12'>
          <Loader2 className='w-6 h-6 animate-spin text-purple' />
          <span className='ml-3 text-[15px] text-neutral-600'>
            Loading clients...
          </span>
        </div>
      )}

      {error && (
        <div className='bg-red-50 border border-red-200 rounded-lg p-4'>
          <p className='text-red-800'>
            Failed to load clients. Please try again later.
          </p>
        </div>
      )}

      {!isLoading && !error && (!accounts || accounts.length === 0) && (
        <div className='bg-white border rounded-lg p-12 text-center'>
          <UsersIcon
            className='w-8 h-8 text-neutral-400 mx-auto mb-4'
            strokeWidth={1.8}
          />
          <h3 className='text-[15px]  text-neutral-500 mb-2'>
            {searchQuery
              ? `No clients found for "${searchQuery}"`
              : 'No clients yet'}
          </h3>
          {!searchQuery && (
            <Button className='bg-purple'>
              <PlusIcon className='w-4 h-4' />
              <span>Add Client</span>
            </Button>
          )}
        </div>
      )}

      {!isLoading && !error && accounts && accounts.length > 0 && (
        <div className='bg-white border rounded-lg overflow-hidden'>
          {selectedRows.size > 0 && (
            <div className='flex items-center justify-between px-4 py-3 bg-purple/10 border-b'>
              <p className='text-sm font-medium text-purple'>
                {selectedRows.size} client{selectedRows.size !== 1 ? 's' : ''}{' '}
                selected
              </p>
              <Button
                variant='outline'
                size='sm'
                onClick={() => setSelectedRows(new Set())}
                className='h-8'
              >
                Clear selection
              </Button>
            </div>
          )}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className='p-4 w-12'>
                  <Checkbox
                    checked={
                      isAllSelected
                        ? true
                        : isSomeSelected
                        ? 'indeterminate'
                        : false
                    }
                    onCheckedChange={toggleSelectAll}
                    aria-label='Select all'
                  />
                </TableHead>
                <TableHead className='p-4'>Name</TableHead>
                <TableHead className='p-4'>Date of Birth</TableHead>
                <TableHead className='p-4'>SSN (Last 4)</TableHead>
                <TableHead className='p-4'>Address</TableHead>
                <TableHead className='p-4'>Created</TableHead>
                <TableHead className='p-4'>Created By</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {accounts.map((account) => (
                <TableRow
                  key={account.id}
                  className='cursor-pointer'
                  onClick={() => {
                    window.location.href = `/clients/${account.id}`;
                  }}
                  data-state={
                    selectedRows.has(account.id) ? 'selected' : undefined
                  }
                >
                  <TableCell
                    className='p-4'
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Checkbox
                      checked={selectedRows.has(account.id)}
                      onCheckedChange={() => toggleRowSelection(account.id)}
                      aria-label={`Select ${account.firstName} ${account.lastName}`}
                    />
                  </TableCell>
                  <TableCell className='font-medium p-4'>
                    <div className='flex items-center gap-3'>
                      <span>
                        {account.firstName} {account.lastName}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className='p-4'>
                    {new Date(account.dateOfBirth).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </TableCell>
                  <TableCell className='p-4'>
                    {account.ssnLastFour ? (
                      <span className='font-mono'>{account.ssnLastFour}</span>
                    ) : (
                      <span className='text-neutral-400'>—</span>
                    )}
                  </TableCell>
                  <TableCell className='p-4'>
                    {account.city && account.state && (
                      <span>
                        {account.address} {account.city}, {account.state}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className='p-4'>
                    {formatDate(account.createdAt)}
                  </TableCell>
                  <TableCell className='p-4 text-neutral-600'>
                    {account.createdBy}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className='flex items-center justify-between p-5 border-t'>
            <div className='flex items-center gap-4'>
              <p className='text-sm text-neutral-600'>
                {Math.min((pageIndex + 1) * pageSize, meta?.total || 0)} of{' '}
                {meta?.total || 0} client{meta?.total !== 1 ? 's' : ''}
              </p>
              {meta && meta.totalPages > 1 && (
                <div className='flex items-center gap-2'>
                  <span className='text-sm text-neutral-600'>
                    Rows per page:
                  </span>
                  <Select
                    value={pageSize.toString()}
                    onValueChange={(value) => {
                      setPageSize(Number(value));
                      setPageIndex(0);
                    }}
                  >
                    <SelectTrigger size='sm'>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='10'>10</SelectItem>
                      <SelectItem value='25'>25</SelectItem>
                      <SelectItem value='50'>50</SelectItem>
                      <SelectItem value='100'>100</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {meta && meta.totalPages > 1 && (
              <div className='flex items-center gap-5'>
                <span className='text-sm text-neutral-600'>
                  Page {pageIndex + 1} of {meta.totalPages}
                </span>
                <div className='flex gap-2'>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => setPageIndex(0)}
                    disabled={pageIndex === 0}
                    className='h-8 w-8 p-0'
                  >
                    <span className='sr-only'>First page</span>
                    <ChevronLeft className='h-4 w-4' />
                    <ChevronLeft className='h-4 w-4 -ml-3' />
                  </Button>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => setPageIndex(pageIndex - 1)}
                    disabled={pageIndex === 0}
                    className='h-8 w-8 p-0'
                  >
                    <span className='sr-only'>Previous page</span>
                    <ChevronLeft className='h-4 w-4' />
                  </Button>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => setPageIndex(pageIndex + 1)}
                    disabled={pageIndex >= meta.totalPages - 1}
                    className='h-8 w-8 p-0'
                  >
                    <span className='sr-only'>Next page</span>
                    <ChevronRight className='h-4 w-4' />
                  </Button>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => setPageIndex(meta.totalPages - 1)}
                    disabled={pageIndex >= meta.totalPages - 1}
                    className='h-8 w-8 p-0'
                  >
                    <span className='sr-only'>Last page</span>
                    <ChevronRight className='h-4 w-4' />
                    <ChevronRight className='h-4 w-4 -ml-3' />
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
