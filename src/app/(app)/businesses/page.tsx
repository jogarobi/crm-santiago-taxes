'use client';

import { useState, useEffect } from 'react';
import { useAllBusinesses, useBusinessCreators } from '@/hooks/use-businesses';
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
  Building2Icon,
  ChevronLeft,
  ChevronRight,
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ListFilter,
  Check,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

function formatEIN(ein: string): string {
  const cleaned = ein.replace(/\D/g, '');

  if (cleaned.length === 9) {
    return `${cleaned.slice(0, 2)}-${cleaned.slice(2)}`;
  }

  return ein;
}

export default function BusinessesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [createdByFilter, setCreatedByFilter] = useState<string>('');

  // Set document title
  useEffect(() => {
    document.title = 'Businesses | Santiago Taxes CRM';
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
  } = useAllBusinesses({
    search: debouncedSearch || undefined,
    pageSize,
    pageIndex,
    sortBy: 'name',
    sortDir,
    createdBy: createdByFilter || undefined,
  });

  const { data: creators = [] } = useBusinessCreators();

  const toggleNameSort = () => {
    setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    setPageIndex(0);
  };

  const businesses = response?.data || [];
  const meta = response?.meta;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className='flex flex-col gap-6'>
      <div className='flex items-center justify-between'>
        <h1 className='text-2xl font-semibold'>Businesses</h1>
      </div>

      <InputGroup className='py-6 bg-white'>
        <InputGroupInput
          placeholder='Search by business name, EIN, or account holder name...'
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
            Loading businesses...
          </span>
        </div>
      )}

      {error && (
        <div className='bg-red-50 border border-red-200 rounded-lg p-4'>
          <p className='text-red-800'>
            Failed to load businesses. Please try again later.
          </p>
        </div>
      )}

      {!isLoading && !error && (!businesses || businesses.length === 0) && (
        <div className='bg-white border rounded-lg p-12 text-center'>
          <Building2Icon
            className='w-8 h-8 text-neutral-400 mx-auto mb-4'
            strokeWidth={1.8}
          />
          <h3 className='text-[15px]  text-neutral-500 mb-2'>
            {searchQuery
              ? `No businesses found for "${searchQuery}"`
              : 'No businesses yet'}
          </h3>
        </div>
      )}

      {!isLoading && !error && businesses && businesses.length > 0 && (
        <div className='bg-white border rounded-lg overflow-hidden'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className='p-4'>
                  <button
                    onClick={toggleNameSort}
                    className='flex items-center gap-1 hover:text-neutral-900 transition-colors'
                  >
                    Business Name
                    {sortDir === 'asc' ? (
                      <ArrowUp className='w-3.5 h-3.5' />
                    ) : (
                      <ArrowDown className='w-3.5 h-3.5' />
                    )}
                  </button>
                </TableHead>
                <TableHead className='p-4'>Account Holder</TableHead>
                <TableHead className='p-4'>Entity Type</TableHead>
                <TableHead className='p-4'>EIN</TableHead>
                <TableHead className='p-4'>Address</TableHead>
                <TableHead className='p-4'>Created</TableHead>
                <TableHead className='p-4'>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className='flex items-center gap-1 hover:text-neutral-900 transition-colors'>
                        Created By
                        <ListFilter
                          className={`w-3.5 h-3.5 ${createdByFilter ? 'text-purple' : 'text-neutral-400'}`}
                        />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align='start' className='min-w-[10rem]'>
                      <DropdownMenuItem
                        onClick={() => { setCreatedByFilter(''); setPageIndex(0); }}
                        className='flex items-center gap-2'
                      >
                        <Check className={`w-3.5 h-3.5 ${!createdByFilter ? 'opacity-100' : 'opacity-0'}`} />
                        All creators
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      {creators.map((name) => (
                        <DropdownMenuItem
                          key={name}
                          onClick={() => { setCreatedByFilter(name); setPageIndex(0); }}
                          className='flex items-center gap-2'
                        >
                          <Check className={`w-3.5 h-3.5 ${createdByFilter === name ? 'opacity-100' : 'opacity-0'}`} />
                          {name}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {businesses.map((business) => (
                <TableRow
                  key={business.id}
                  className='cursor-pointer'
                  onClick={() => {
                    window.location.href = `/clients/${business.accountId}/businesses/${business.id}`;
                  }}
                >
                  <TableCell className='font-medium p-4'>
                    <div className='flex items-center gap-3'>
                      <span>{business.registeredName}</span>
                    </div>
                  </TableCell>
                  <TableCell className='p-4'>
                    {business.account ? (
                      <span>
                        {business.account.firstName} {business.account.lastName}
                      </span>
                    ) : (
                      <span className='text-neutral-400'>—</span>
                    )}
                  </TableCell>
                  <TableCell className='p-4'>
                    {business.entity?.name ? (
                      <span className='text-sm font-medium bg-neutral-100 rounded-full px-3 py-1 capitalize'>
                        {business.entity.name}
                      </span>
                    ) : (
                      <span className='text-neutral-400'>—</span>
                    )}
                  </TableCell>
                  <TableCell className='p-4'>
                    {business.ein ? (
                      <span className='font-mono'>{formatEIN(business.ein)}</span>
                    ) : (
                      <span className='text-neutral-400'>—</span>
                    )}
                  </TableCell>
                  <TableCell className='p-4'>
                    {business.city && business.state ? (
                      <span>
                        {business.city}, {business.state}
                      </span>
                    ) : business.address ? (
                      <span>{business.address}</span>
                    ) : (
                      <span className='text-neutral-400'>—</span>
                    )}
                  </TableCell>
                  <TableCell className='p-4'>
                    {formatDate(business.createdAt)}
                  </TableCell>
                  <TableCell className='p-4 text-neutral-600'>
                    {business.createdBy}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className='flex items-center justify-between p-5 border-t'>
            <div className='flex items-center gap-4'>
              <p className='text-sm text-neutral-600'>
                {Math.min((pageIndex + 1) * pageSize, meta?.total || 0)} of{' '}
                {meta?.total || 0} business{meta?.total !== 1 ? 'es' : ''}
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
