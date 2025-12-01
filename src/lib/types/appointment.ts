import { Booking } from 'square';

export type DbAppointment = {
  id: string;
  squareId?: string | null;
  status: string;
  startAt: string;
  endAt: string;
  durationMinutes?: number | null;
  accountId?: number | null;
  accountName?: string | null;
  service?: string | null;
  staffId?: number | null;
  creatorType: string;
  createdBy?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  updatedBy?: string | null;
  customerId?: string;
};

export type Appointment = Partial<Booking> & {
  id?: string;
  status?: string;
  startAt?: string;
  endAt?: string;
  accountId?: number | null;
  accountName?: string;
  service?: string;
  durationMinutes?: number;
  customerId?: string;
  customerNote?: string;
  appointmentSegments?: Booking['appointmentSegments'];
  creatorType?: string;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
  updatedBy?: string;
};

export type AppointmentResponse = {
  success: true;
  appointments: Appointment[];
  count: number;
};

export type SingleAppointmentResponse = {
  success: true;
  appointment: Appointment;
};

export type AppointmentErrorResponse = {
  success: false;
  error: string;
  message: string;
};

export type ListAppointmentsParams = {
  limit?: number;
  cursor?: string;
  customerId?: string;
  teamMemberId?: string;
  locationId?: string;
  startAtMin?: string;
  startAtMax?: string;
};

export type CreateAppointmentInput = {
  startAt: string;
  customerId?: string;
  customerNote?: string;
  sellerNote?: string;
  serviceName?: string;
  appointmentSegments: Array<{
    durationMinutes: number;
    serviceVariationId: string;
    teamMemberId: string;
    serviceVariationVersion?: bigint;
  }>;
};

export type UpdateAppointmentInput = {
  startAt?: string;
  locationId?: string;
  customerId?: string;
  customerNote?: string;
  sellerNote?: string;
  version?: number;
  appointmentSegments?: Array<{
    durationMinutes: number;
    serviceVariationId: string;
    teamMemberId: string;
    serviceVariationVersion?: bigint;
  }>;
};

export type CancelAppointmentInput = {
  bookingVersion?: number;
};

export type SearchAvailabilityInput = {
  query: {
    filter: {
      startAtRange?: {
        startAt?: string;
        endAt?: string;
      };
      locationId?: string;
      segmentFilters?: Array<{
        serviceVariationId: string;
        teamMemberIdFilter?: {
          all?: string[];
          any?: string[];
          none?: string[];
        };
      }>;
    };
  };
};
