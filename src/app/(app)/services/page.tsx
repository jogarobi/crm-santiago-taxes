'use client';

import { useState, useEffect } from 'react';
import { useServices } from '@/hooks/use-services';
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
  PackageIcon,
  Search,
  Pencil,
  Trash2,
} from 'lucide-react';
import {
  InputGroup,
  InputGroupInput,
  InputGroupAddon,
} from '@/components/ui/input-group';
import { Badge } from '@/components/ui/badge';
import { CreateServiceDialog } from '@/components/CreateServiceDialog';
import { EditServiceDialog } from '@/components/EditServiceDialog';
import { DeleteServiceDialog } from '@/components/DeleteServiceDialog';
import type { Service } from '@/lib/types/service';

export default function ServicesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);

  useEffect(() => {
    document.title = 'Services | Santiago Taxes CRM';
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const {
    data: response,
    isLoading,
    error,
    refetch,
  } = useServices({
    search: debouncedSearch || undefined,
  });

  const services = response?.services || [];

  const handleEditClick = (service: Service) => {
    setSelectedService(service);
    setIsEditDialogOpen(true);
  };

  const handleDeleteClick = (service: Service) => {
    setSelectedService(service);
    setIsDeleteDialogOpen(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getStatusBadge = (isActive: boolean) => {
    if (isActive) {
      return (
        <Badge variant='default' className='bg-green-100 text-green-800'>
          Active
        </Badge>
      );
    }
    return (
      <Badge variant='secondary' className='bg-gray-100 text-gray-800'>
        Inactive
      </Badge>
    );
  };

  return (
    <div className='flex flex-col gap-6'>
      <div className='flex items-center justify-between'>
        <h1 className='text-2xl font-semibold'>Services</h1>
        <Button
          className='bg-purple'
          onClick={() => setIsCreateDialogOpen(true)}
        >
          <PlusIcon className='w-4 h-4' />
          <span>New Service</span>
        </Button>
      </div>

      <InputGroup className='py-6 bg-white'>
        <InputGroupInput
          placeholder='Search services...'
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
            Loading services...
          </span>
        </div>
      )}

      {error && (
        <div className='bg-red-50 border border-red-200 rounded-lg p-4'>
          <p className='text-red-800'>
            Failed to load services. Please try again later.
          </p>
        </div>
      )}

      {!isLoading && !error && (!services || services.length === 0) && (
        <div className='bg-white border rounded-lg p-12 text-center'>
          <PackageIcon
            className='w-8 h-8 text-neutral-400 mx-auto mb-4'
            strokeWidth={1.8}
          />
          <h3 className='text-[15px] text-neutral-500 mb-2'>
            {searchQuery
              ? `No services found for "${searchQuery}"`
              : 'No services yet'}
          </h3>
          {!searchQuery && (
            <Button
              className='bg-purple mt-4'
              onClick={() => setIsCreateDialogOpen(true)}
            >
              <PlusIcon className='w-4 h-4' />
              <span>Add Service</span>
            </Button>
          )}
        </div>
      )}

      {!isLoading && !error && services && services.length > 0 && (
        <div className='bg-white border rounded-lg overflow-hidden'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className='p-4'>Name</TableHead>
                <TableHead className='p-4'>Status</TableHead>
                <TableHead className='p-4'>Created</TableHead>
                <TableHead className='p-4'>Created By</TableHead>
                <TableHead className='p-4'>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {services.map((service) => (
                <TableRow key={service.id}>
                  <TableCell className='font-medium p-4'>
                    {service.name}
                  </TableCell>
                  <TableCell className='p-4'>
                    {getStatusBadge(service.isActive)}
                  </TableCell>
                  <TableCell className='p-4'>
                    {formatDate(service.createdAt)}
                  </TableCell>
                  <TableCell className='p-4'>
                    {service.createdBy}
                  </TableCell>
                  <TableCell className='p-4'>
                    <div className='flex gap-2'>
                      <Button
                        variant='ghost'
                        size='sm'
                        onClick={() => handleEditClick(service)}
                        className='h-8 w-8 p-0'
                      >
                        <Pencil className='h-4 w-4' />
                        <span className='sr-only'>Edit</span>
                      </Button>
                      <Button
                        variant='ghost'
                        size='sm'
                        onClick={() => handleDeleteClick(service)}
                        className='h-8 w-8 p-0 text-red-600 hover:text-red-700'
                      >
                        <Trash2 className='h-4 w-4' />
                        <span className='sr-only'>Delete</span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <CreateServiceDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSuccess={() => refetch()}
      />
      <EditServiceDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        service={selectedService}
        onSuccess={() => refetch()}
      />
      <DeleteServiceDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        service={selectedService}
        onSuccess={() => refetch()}
      />
    </div>
  );
}
