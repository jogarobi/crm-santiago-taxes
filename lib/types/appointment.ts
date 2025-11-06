import { Booking } from 'square';

// Re-export Square's Booking type as Appointment for domain consistency
export type Appointment = Booking;

// API Response Types
export type AppointmentResponse = {
  success: true;
  appointments: Appointment[];
  count: number;
  cursor?: string;
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

// Request Types
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
  locationId: string;
  customerId?: string;
  customerNote?: string;
  sellerNote?: string;
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
