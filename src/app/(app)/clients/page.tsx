'use client';

import { useState, useEffect } from 'react';
import { useAccounts, useAccountCreators } from '@/hooks/use-accounts';
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
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ListFilter,
  Check,
  FlagIcon,
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
import { CreateClientDialog } from '@/components/CreateClientDialog';

export default function ClientsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [createdByFilter, setCreatedByFilter] = useState<string>('');

  useEffect(() => {
    document.title = 'Clients | Santiago Taxes CRM';
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPageIndex(0);
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
    accountType: 'clients',
    sortBy: 'name',
    sortDir,
    createdBy: createdByFilter || undefined,
  });

  const { data: creators = [] } = useAccountCreators();

  const toggleNameSort = () => {
    setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    setPageIndex(0);
  };

  const accounts = response?.data || [];
  const meta = response?.meta;

  const formatPhone = (phone: string | null | undefined) => {
    if (!phone) return null;
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10)
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    if (cleaned.length === 11 && cleaned[0] === '1')
      return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
    return phone;
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return '—';

    let d = new Date(dateString);

    // Handle DD/M/YY or DD/MM/YYYY stored as slash-separated strings
    if (isNaN(d.getTime()) && dateString.includes('/')) {
      const [dayStr, monthStr, yearStr] = dateString.split('/');
      const day = parseInt(dayStr, 10);
      const month = parseInt(monthStr, 10) - 1;
      let year = parseInt(yearStr, 10);
      if (year < 100) year += year < 30 ? 2000 : 1900;
      d = new Date(year, month, day);
    }

    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className='flex flex-col gap-6'>
      <div className='flex items-center justify-between'>
        <h1 className='text-2xl font-semibold'>Clients</h1>

        <Button
          className='bg-purple'
          onClick={() => setIsCreateDialogOpen(true)}
        >
          <PlusIcon className='w-4 h-4' />
          <span>New Client</span>
        </Button>
      </div>

      <InputGroup className='py-6 bg-white'>
        <InputGroupInput
          placeholder='Search by name, phone, SSN last 4 digits, or ID...'
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
            <Button
              className='bg-purple'
              onClick={() => setIsCreateDialogOpen(true)}
            >
              <PlusIcon className='w-4 h-4' />
              <span>Add Client</span>
            </Button>
          )}
        </div>
      )}

      {!isLoading && !error && accounts && accounts.length > 0 && (
        <div className='bg-white border rounded-lg overflow-hidden'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className='p-4'>
                  <button
                    onClick={toggleNameSort}
                    className='flex items-center gap-1 hover:text-neutral-900 transition-colors'
                  >
                    Name
                    {sortDir === 'asc' ? (
                      <ArrowUp className='w-3.5 h-3.5' />
                    ) : sortDir === 'desc' ? (
                      <ArrowDown className='w-3.5 h-3.5' />
                    ) : (
                      <ArrowUpDown className='w-3.5 h-3.5 text-neutral-400' />
                    )}
                  </button>
                </TableHead>
                <TableHead className='p-4'>Date of Birth</TableHead>
                <TableHead className='p-4'>SSN (Last 4)</TableHead>
                <TableHead className='p-4'>Phone</TableHead>
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
                    <DropdownMenuContent align='start' className='min-w-40'>
                      <DropdownMenuItem
                        onClick={() => {
                          setCreatedByFilter('');
                          setPageIndex(0);
                        }}
                        className='flex items-center gap-2'
                      >
                        <Check
                          className={`w-3.5 h-3.5 ${!createdByFilter ? 'opacity-100' : 'opacity-0'}`}
                        />
                        All creators
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      {creators.map((name) => (
                        <DropdownMenuItem
                          key={name}
                          onClick={() => {
                            setCreatedByFilter(name);
                            setPageIndex(0);
                          }}
                          className='flex items-center gap-2'
                        >
                          <Check
                            className={`w-3.5 h-3.5 ${createdByFilter === name ? 'opacity-100' : 'opacity-0'}`}
                          />
                          {name}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableHead>
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
                >
                  <TableCell className='font-medium p-4'>
                    <div className='flex items-center gap-2'>
                      {account.flag && (
                        <FlagIcon
                          className='w-3.5 h-3.5 text-red-500 shrink-0'
                        />
                      )}
                      <span>
                        {account.firstName} {account.lastName}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className='p-4'>
                    {formatDate(account.dateOfBirth)}
                  </TableCell>
                  <TableCell className='p-4'>
                    {account.ssnLastFour ? (
                      <span className='font-mono'>{account.ssnLastFour}</span>
                    ) : (
                      <span className='text-neutral-400'>—</span>
                    )}
                  </TableCell>
                  <TableCell className='p-4'>
                    {formatPhone(account.phoneNumber) ?? (
                      <span className='text-neutral-400'>—</span>
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
      <CreateClientDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
      />
    </div>
  );
}
