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

type AvailabilityParams = {
  selectedDate: string;
  serviceVariationId: string;
  teamMemberId: string;
};

export const appointmentKeys = {
  all: ['appointments'] as const,
  lists: () => [...appointmentKeys.all, 'list'] as const,
  list: (filters?: ListAppointmentsParams) =>
    [...appointmentKeys.lists(), { filters }] as const,
  details: () => [...appointmentKeys.all, 'detail'] as const,
  detail: (id: string) => [...appointmentKeys.details(), id] as const,
  availability: (input?: SearchAvailabilityInput | AvailabilityParams) =>
    [...appointmentKeys.all, 'availability', { input }] as const,
  count: () => [...appointmentKeys.all, 'count'] as const,
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
  if (params?.accountId) queryParams.append('account_id', params.accountId.toString());

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
  accountId: number,
  customerId?: string
): Promise<Appointment> {
  const response = await fetch(`/api/appointments/${id}/sync`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ accountId, customerId }),
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

async function fetchAvailability(
  params: AvailabilityParams
): Promise<string[]> {
  const { selectedDate, serviceVariationId, teamMemberId } = params;

  const response = await fetch('/api/appointments/search-availability', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: {
        filter: {
          startAtRange: {
            startAt: `${selectedDate}T00:00:00.000Z`,
            endAt: `${selectedDate}T23:59:00.000Z`,
          },
          segmentFilters: [
            {
              serviceVariationId,
              teamMemberIdFilter: {
                any: [teamMemberId],
              },
            },
          ],
        },
      },
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to fetch availability');
  }

  const data = await response.json();
  const availabilities = data.availabilities || [];

  const timeSlots: string[] = [];
  availabilities.forEach(
    (availability: { startAt?: string; endAt?: string }) => {
      if (availability.startAt) {
        const startTime = new Date(availability.startAt);
        const hours = startTime.getHours().toString().padStart(2, '0');
        const minutes = startTime.getMinutes().toString().padStart(2, '0');
        timeSlots.push(`${hours}:${minutes}`);
      }
    }
  );

  return timeSlots;
}

export function useAvailability(params: AvailabilityParams | null) {
  return useQuery({
    queryKey: appointmentKeys.availability(params || undefined),
    queryFn: () => fetchAvailability(params!),
    enabled:
      !!params?.selectedDate &&
      !!params?.serviceVariationId &&
      !!params?.teamMemberId,
  });
}

type DateRangeAvailabilityParams = {
  startDate: string;
  endDate: string;
  teamMemberIds: string[];
  serviceVariationIds?: string[];
};

export type AvailabilitySlot = {
  startAt: string;
  appointmentSegments?: Array<{
    teamMemberId?: string;
  }>;
};

async function fetchDateRangeAvailability(
  params: DateRangeAvailabilityParams
): Promise<AvailabilitySlot[]> {
  const { startDate, endDate, teamMemberIds, serviceVariationIds } = params;

  const segmentFilters =
    serviceVariationIds && serviceVariationIds.length > 0
      ? serviceVariationIds.map((serviceVariationId) => ({
          serviceVariationId,
          teamMemberIdFilter: {
            any: teamMemberIds,
          },
        }))
      : [
          {
            teamMemberIdFilter: {
              any: teamMemberIds,
            },
          },
        ];

  const response = await fetch('/api/appointments/search-availability', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: {
        filter: {
          startAtRange: {
            startAt: startDate,
            endAt: endDate,
          },
          segmentFilters,
        },
      },
    }),
  });

  console.log(segmentFilters);

  if (!response.ok) return [];

  const data = await response.json();
  console.log('DATA');
  console.log(data);
  const availabilities = data.availabilities || [];

  return availabilities;
}

export function useDateRangeAvailability(
  params: DateRangeAvailabilityParams | null
) {
  return useQuery({
    queryKey: [
      ...appointmentKeys.all,
      'dateRangeAvailability',
      params,
    ] as const,
    queryFn: () => fetchDateRangeAvailability(params!),
    enabled: !!params?.startDate && !!params?.endDate && !!params?.teamMemberIds && params.teamMemberIds.length > 0,
    staleTime: 1000 * 60 * 5,
  });
}

export function useSyncAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      accountId,
      customerId,
    }: {
      id: string;
      accountId: number;
      customerId?: string;
    }) => syncAppointment(id, accountId, customerId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: appointmentKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: appointmentKeys.detail(variables.id),
      });
    },
  });
}

async function fetchAppointmentCount(): Promise<{
  success: boolean;
  count: number;
}> {
  const response = await fetch('/api/appointments/count');
  if (!response.ok) {
    throw new Error('Failed to fetch appointment count');
  }
  return response.json();
}

export function useAppointmentCount() {
  return useQuery({
    queryKey: appointmentKeys.count(),
    queryFn: fetchAppointmentCount,
  });
}
