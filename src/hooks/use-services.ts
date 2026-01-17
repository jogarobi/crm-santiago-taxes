import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Service, CreateServiceInput, UpdateServiceInput } from '@/lib/types/service';

// Query Keys
export const serviceKeys = {
  all: ['services'] as const,
  lists: () => [...serviceKeys.all, 'list'] as const,
  list: (params?: FetchServicesParams) => [...serviceKeys.lists(), params] as const,
  details: () => [...serviceKeys.all, 'detail'] as const,
  detail: (serviceId: number) => [...serviceKeys.details(), serviceId] as const,
};

// Types
export interface FetchServicesParams {
  search?: string;
  isActive?: boolean;
  limit?: number;
  offset?: number;
}

export interface ServicesResponse {
  success: boolean;
  services: Service[];
  count: number;
  total: number;
  hasMore: boolean;
}

export interface ServiceResponse {
  success: boolean;
  service: Service;
}

// API Functions
async function fetchServices(params?: FetchServicesParams): Promise<ServicesResponse> {
  const urlParams = new URLSearchParams();

  if (params?.search) {
    urlParams.append('search', params.search);
  }
  if (params?.isActive !== undefined) {
    urlParams.append('isActive', params.isActive.toString());
  }
  if (params?.limit !== undefined) {
    urlParams.append('limit', params.limit.toString());
  }
  if (params?.offset !== undefined) {
    urlParams.append('offset', params.offset.toString());
  }

  const response = await fetch(`/api/services?${urlParams.toString()}`);
  if (!response.ok) {
    throw new Error('Failed to fetch services');
  }
  return response.json();
}

async function fetchService(serviceId: number): Promise<ServiceResponse> {
  const response = await fetch(`/api/services/${serviceId}`);
  if (!response.ok) {
    throw new Error('Failed to fetch service');
  }
  return response.json();
}

async function createService(data: CreateServiceInput): Promise<ServiceResponse> {
  const response = await fetch('/api/services', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error('Failed to create service');
  }
  return response.json();
}

async function updateService(
  serviceId: number,
  data: UpdateServiceInput
): Promise<ServiceResponse> {
  const response = await fetch(`/api/services/${serviceId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error('Failed to update service');
  }
  return response.json();
}

async function deleteService(serviceId: number): Promise<{ success: boolean; message: string }> {
  const response = await fetch(`/api/services/${serviceId}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error('Failed to delete service');
  }
  return response.json();
}

// Hooks
export function useServices(params?: FetchServicesParams) {
  return useQuery({
    queryKey: serviceKeys.list(params),
    queryFn: () => fetchServices(params),
  });
}

export function useService(serviceId: number) {
  return useQuery({
    queryKey: serviceKeys.detail(serviceId),
    queryFn: () => fetchService(serviceId),
    enabled: !!serviceId,
  });
}

export function useCreateService() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateServiceInput) => createService(data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        predicate: (query) =>
          query.queryKey[0] === 'services' && query.queryKey[1] === 'list',
      });
    },
  });
}

export function useUpdateService() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ serviceId, data }: { serviceId: number; data: UpdateServiceInput }) =>
      updateService(serviceId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: serviceKeys.detail(variables.serviceId) });
      queryClient.invalidateQueries({
        predicate: (query) =>
          query.queryKey[0] === 'services' && query.queryKey[1] === 'list',
      });
    },
  });
}

export function useDeleteService() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (serviceId: number) => deleteService(serviceId),
    onSuccess: (_, serviceId) => {
      queryClient.invalidateQueries({ queryKey: serviceKeys.detail(serviceId) });
      queryClient.invalidateQueries({
        predicate: (query) =>
          query.queryKey[0] === 'services' && query.queryKey[1] === 'list',
      });
    },
  });
}
