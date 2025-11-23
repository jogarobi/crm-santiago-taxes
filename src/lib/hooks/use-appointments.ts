import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  Appointment,
  AppointmentResponse,
  SingleAppointmentResponse,
  ListAppointmentsParams,
  CreateAppointmentInput,
  UpdateAppointmentInput,
  SearchAvailabilityInput,
} from '@/lib/types/appointment';

export const appointmentKeys = {
  all: ['appointments'] as const,
  lists: () => [...appointmentKeys.all, 'list'] as const,
  list: (filters?: ListAppointmentsParams) =>
    [...appointmentKeys.lists(), { filters }] as const,
  details: () => [...appointmentKeys.all, 'detail'] as const,
  detail: (id: string) => [...appointmentKeys.details(), id] as const,
  availability: (input?: SearchAvailabilityInput) =>
    [...appointmentKeys.all, 'availability', { input }] as const,
};

async function fetchAppointments(
  params?: ListAppointmentsParams
): Promise<Appointment[]> {
  const queryParams = new URLSearchParams();

  if (params?.limit) queryParams.append('limit', params.limit.toString());
  if (params?.cursor) queryParams.append('cursor', params.cursor);
  if (params?.customerId) queryParams.append('customer_id', params.customerId);
  if (params?.teamMemberId)
    queryParams.append('team_member_id', params.teamMemberId);
  if (params?.locationId) queryParams.append('location_id', params.locationId);
  if (params?.startAtMin) queryParams.append('start_at_min', params.startAtMin);
  if (params?.startAtMax) queryParams.append('start_at_max', params.startAtMax);

  const url = `/api/appointments${
    queryParams.toString() ? `?${queryParams.toString()}` : ''
  }`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error('Failed to fetch appointments');
  }

  const data: AppointmentResponse = await response.json();
  return data.appointments;
}

async function fetchAppointment(id: string): Promise<Appointment> {
  const response = await fetch(`/api/appointments/${id}`);

  if (!response.ok) {
    throw new Error('Failed to fetch appointment');
  }

  const data: SingleAppointmentResponse = await response.json();
  return data.appointment;
}

async function createAppointment(
  input: CreateAppointmentInput
): Promise<Appointment> {
  const response = await fetch('/api/appointments', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error('Failed to create appointment');
  }

  const data: SingleAppointmentResponse = await response.json();
  return data.appointment;
}

async function updateAppointment(
  id: string,
  input: UpdateAppointmentInput
): Promise<Appointment> {
  const response = await fetch(`/api/appointments/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error('Failed to update appointment');
  }

  const data: SingleAppointmentResponse = await response.json();
  return data.appointment;
}

async function cancelAppointment(
  id: string,
  bookingVersion?: number
): Promise<Appointment> {
  const url = bookingVersion
    ? `/api/appointments/${id}?booking_version=${bookingVersion}`
    : `/api/appointments/${id}`;

  const response = await fetch(url, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error('Failed to cancel appointment');
  }

  const data: SingleAppointmentResponse = await response.json();
  return data.appointment;
}

async function searchAvailability(input: SearchAvailabilityInput) {
  const response = await fetch('/api/appointments/search-availability', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error('Failed to search availability');
  }

  return response.json();
}

async function syncAppointment(
  id: string,
  accountId: number
): Promise<Appointment> {
  const response = await fetch(`/api/appointments/${id}/sync`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ accountId }),
  });

  if (!response.ok) {
    throw new Error('Failed to sync appointment with client');
  }

  const data = await response.json();
  return data.appointment;
}

export function useAppointments(params?: ListAppointmentsParams) {
  const normalizedParams = useMemo(() => {
    if (!params) return undefined;

    const filtered = Object.fromEntries(
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      Object.entries(params).filter(([_, v]) => v !== undefined)
    );

    return Object.keys(filtered).length > 0 ? filtered : undefined;
  }, [params]);

  return useQuery({
    queryKey: appointmentKeys.list(normalizedParams as ListAppointmentsParams),
    queryFn: () => fetchAppointments(params),
  });
}

export function useAppointment(id: string) {
  return useQuery({
    queryKey: appointmentKeys.detail(id),
    queryFn: () => fetchAppointment(id),
    enabled: !!id,
  });
}

export function useCreateAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createAppointment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: appointmentKeys.lists() });
    },
  });
}

export function useUpdateAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateAppointmentInput }) =>
      updateAppointment(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: appointmentKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: appointmentKeys.detail(variables.id),
      });
    },
  });
}

export function useCancelAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      bookingVersion,
    }: {
      id: string;
      bookingVersion?: number;
    }) => cancelAppointment(id, bookingVersion),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: appointmentKeys.lists() });
    },
  });
}

export function useSearchAvailability() {
  return useMutation({
    mutationFn: searchAvailability,
  });
}

export function useSyncAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, accountId }: { id: string; accountId: number }) =>
      syncAppointment(id, accountId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: appointmentKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: appointmentKeys.detail(variables.id),
      });
    },
  });
}
