'use client';

import { useState, useEffect } from 'react';
import { useStaff, useDeleteStaff } from '@/hooks/use-staff';
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
import { Badge } from '@/components/ui/badge';
import { CreateStaffDialog } from '@/components/CreateStaffDialog';
import { EditStaffDialog } from '@/components/EditStaffDialog';
import { DeleteStaffDialog } from '@/components/DeleteStaffDialog';
import { Pencil, Trash2 } from 'lucide-react';
import type { Staff } from '@/hooks/use-staff';

export default function StaffPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const deleteStaff = useDeleteStaff();

  // Set document title effect
  useEffect(() => {
    document.title = 'Staff | Santiago Taxes CRM';
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
    refetch,
  } = useStaff({
    search: debouncedSearch || undefined,
    pageSize,
    pageIndex,
  });

  const staffMembers = response?.data || [];
  const meta = response?.meta;

  const handleCreateSuccess = () => {
    refetch();
  };

  const handleEditClick = (staff: Staff) => {
    setSelectedStaff(staff);
    setIsEditDialogOpen(true);
  };

  const handleDeleteClick = (staff: Staff) => {
    setSelectedStaff(staff);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedStaff) return;

    try {
      console.log('STAFF ID');
      console.log(selectedStaff.id);
      await deleteStaff.mutateAsync(selectedStaff.id);
      setIsDeleteDialogOpen(false);
      setSelectedStaff(null);
      refetch();
    } catch (error) {
      console.error('Error deleting staff member:', error);
    }
  };

  const handleUpdateSuccess = () => {
    refetch();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getStatusBadge = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower === 'active') {
      return (
        <Badge variant='default' className='bg-green-100 text-green-800'>
          Active
        </Badge>
      );
    }
    return (
      <Badge variant='secondary' className='bg-gray-100 text-gray-800'>
        {status}
      </Badge>
    );
  };

  return (
    <div className='flex flex-col gap-6'>
      <div className='flex items-center justify-between'>
        <h1 className='text-2xl font-semibold'>Staff Members</h1>
        <Button
          className='bg-purple'
          onClick={() => setIsCreateDialogOpen(true)}
        >
          <PlusIcon className='w-4 h-4' />
          <span>New Staff Member</span>
        </Button>
      </div>

      <InputGroup className='py-6 bg-white'>
        <InputGroupInput
          placeholder='Search by name, title, or ID...'
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
            Loading staff members...
          </span>
        </div>
      )}

      {error && (
        <div className='bg-red-50 border border-red-200 rounded-lg p-4'>
          <p className='text-red-800'>
            Failed to load staff members. Please try again later.
          </p>
        </div>
      )}

      {!isLoading && !error && (!staffMembers || staffMembers.length === 0) && (
        <div className='bg-white border rounded-lg p-12 text-center'>
          <UsersIcon
            className='w-8 h-8 text-neutral-400 mx-auto mb-4'
            strokeWidth={1.8}
          />
          <h3 className='text-[15px] text-neutral-500 mb-2'>
            {searchQuery
              ? `No staff members found for "${searchQuery}"`
              : 'No staff members yet'}
          </h3>
          {!searchQuery && (
            <Button
              className='bg-purple mt-4'
              onClick={() => setIsCreateDialogOpen(true)}
            >
              <PlusIcon className='w-4 h-4' />
              <span>Add Staff Member</span>
            </Button>
          )}
        </div>
      )}

      {!isLoading && !error && staffMembers && staffMembers.length > 0 && (
        <div className='bg-white border rounded-lg overflow-hidden'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className='p-4'>Name</TableHead>
                <TableHead className='p-4'>Role</TableHead>
                <TableHead className='p-4'>Email</TableHead>
                <TableHead className='p-4'>Status</TableHead>
                <TableHead className='p-4'>Created</TableHead>
                <TableHead className='p-4'>Created By</TableHead>
                <TableHead className='p-4'>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {staffMembers.map((member) => (
                <TableRow key={member.id}>
                  <TableCell className='font-medium p-4'>
                    <div className='flex items-center gap-3'>
                      <span>
                        {member.firstName} {member.lastName}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className='p-4'>
                    {member.role ? (
                      <Badge
                        variant='secondary'
                        className={
                          member.role === 'owner'
                            ? 'bg-purple-100 text-purple-800'
                            : member.role === 'admin'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-gray-100 text-gray-800'
                        }
                      >
                        {member.role.charAt(0).toUpperCase() +
                          member.role.slice(1)}
                      </Badge>
                    ) : (
                      <span className='text-neutral-400'>—</span>
                    )}
                  </TableCell>
                  <TableCell className='p-4'>
                    {member.email || (
                      <span className='text-neutral-400'>—</span>
                    )}
                  </TableCell>
                  <TableCell className='p-4'>
                    {getStatusBadge(member.status)}
                  </TableCell>
                  <TableCell className='p-4'>
                    {formatDate(member.createdAt)}
                  </TableCell>
                  <TableCell className='p-4 text-neutral-600'>
                    {member.createdBy}
                  </TableCell>
                  <TableCell className='p-4'>
                    <div className='flex gap-2'>
                      <Button
                        variant='outline'
                        size='sm'
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditClick(member);
                        }}
                        className='h-8'
                      >
                        <Pencil className='w-4 h-4 mr-1' />
                        Edit
                      </Button>
                      <Button
                        variant='outline'
                        size='sm'
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteClick(member);
                        }}
                        className='h-8 text-red-600 hover:text-red-700 hover:bg-red-50'
                      >
                        <Trash2 className='w-4 h-4 mr-1' />
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className='flex items-center justify-between p-5 border-t'>
            <div className='flex items-center gap-4'>
              <p className='text-sm text-neutral-600'>
                {Math.min((pageIndex + 1) * pageSize, meta?.total || 0)} of{' '}
                {meta?.total || 0} staff member{meta?.total !== 1 ? 's' : ''}
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
      <CreateStaffDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onCreateSuccess={handleCreateSuccess}
      />
      <EditStaffDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        staffMember={selectedStaff}
        onUpdateSuccess={handleUpdateSuccess}
      />
      <DeleteStaffDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        staffName={
          selectedStaff
            ? `${selectedStaff.firstName} ${selectedStaff.lastName}`
            : ''
        }
        onConfirm={handleDeleteConfirm}
        isDeleting={deleteStaff.isPending}
      />
    </div>
  );
}
