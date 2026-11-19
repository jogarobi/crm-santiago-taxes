import { Appointment } from '@/lib/types/appointment';
import { CalendarEvent } from '@/components/Calendar/types';

/**
 * Safety net for duplicate appointments arriving from Square (webhook + sync
 * can both insert the same booking before the backend upsert-on-squareId fix
 * ships). The API maps each row's `id` to its squareId when present
 * (`apt.squareId || apt.id`), so duplicates of the same booking share an `id`.
 * Keeps the first occurrence per id.
 */
export function dedupeBySquareId(appointments: Appointment[]): Appointment[] {
  const seen = new Set<string>();
  return appointments.filter((apt) => {
    if (!apt.id) return true;
    if (seen.has(apt.id)) return false;
    seen.add(apt.id);
    return true;
  });
}

export function transformAppointmentsToCalendarEvents(
  appointments: Appointment[],
  getColor?: (appointment: Appointment) => string
): CalendarEvent[] {
  return appointments
    .filter(
      (appointment) =>
        appointment.id &&
        appointment.startAt &&
        appointment.status !== 'CANCELLED_BY_CUSTOMER' &&
        appointment.status !== 'CANCELLED_BY_SELLER'
    )
    .map((appointment) => {
      const startDate = new Date(appointment.startAt!);

      let endDate: Date;
      if (appointment.endAt) {
        endDate = new Date(appointment.endAt);
      } else if (appointment.durationMinutes) {
        endDate = new Date(
          startDate.getTime() + appointment.durationMinutes * 60000
        );
      } else {
        endDate = new Date(startDate.getTime() + 60 * 60000);
      }

      let title = 'Appointment';
      if (appointment.accountName) {
        title = appointment.accountName;
      } else if (appointment.service) {
        title = appointment.service;
      }

      return {
        id: appointment.id!,
        title,
        startDate,
        endDate,
        description: appointment.service || undefined,
        location: undefined, // Square appointments don't typically have location in the response
        status: appointment.status,
        color: getColor
          ? getColor(appointment)
          : getStatusColor(appointment.status),
      };
    });
}

function getStatusColor(status?: string): string {
  switch (status) {
    case 'ACCEPTED':
      return '#10B981'; // green
    case 'PENDING':
      return '#F59E0B'; // amber
    case 'CANCELLED':
    case 'DECLINED':
      return '#EF4444'; // red
    case 'NO_SHOW':
      return '#6B7280'; // gray
    default:
      return '#3B82F6'; // blue
  }
}
