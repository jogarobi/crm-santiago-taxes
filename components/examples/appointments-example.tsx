'use client';

import {
  useAppointments,
  useCreateAppointment,
  useUpdateAppointment,
  useCancelAppointment,
  useSearchAvailability,
} from '@/lib/hooks/use-appointments';

/**
 * Example component demonstrating how to use the Appointments hooks
 * This is a reference implementation - adapt it to your needs
 */
export function AppointmentsExample() {
  // Fetch all appointments with optional filters
  const {
    data: appointments,
    isLoading,
    error,
  } = useAppointments({
    limit: 10,
    locationId: 'YOUR_LOCATION_ID',
    // startAtMin: new Date().toISOString(), // Appointments starting from now
    // startAtMax: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // Next 30 days
  });

  // Create appointment mutation
  const createAppointment = useCreateAppointment();

  // Update appointment mutation
  const updateAppointment = useUpdateAppointment();

  // Cancel appointment mutation
  const cancelAppointment = useCancelAppointment();

  // Search availability mutation
  const searchAvailability = useSearchAvailability();

  // Example: Create a new appointment
  const handleCreateAppointment = () => {
    createAppointment.mutate({
      startAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
      locationId: 'YOUR_LOCATION_ID',
      customerId: 'CUSTOMER_ID',
      appointmentSegments: [
        {
          durationMinutes: 60,
          serviceVariationId: 'SERVICE_VARIATION_ID',
          teamMemberId: 'TEAM_MEMBER_ID',
        },
      ],
    });
  };

  // Example: Update an appointment
  const handleUpdateAppointment = (id: string, version: number) => {
    updateAppointment.mutate({
      id,
      data: {
        startAt: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(), // Move to day after tomorrow
        version,
      },
    });
  };

  // Example: Cancel an appointment
  const handleCancelAppointment = (id: string, version?: number) => {
    cancelAppointment.mutate({
      id,
      bookingVersion: version,
    });
  };

  // Example: Search for available time slots
  const handleSearchAvailability = () => {
    searchAvailability.mutate({
      query: {
        filter: {
          startAtRange: {
            startAt: new Date().toISOString(),
            endAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // Next 7 days
          },
          locationId: 'YOUR_LOCATION_ID',
          segmentFilters: [
            {
              serviceVariationId: 'SERVICE_VARIATION_ID',
            },
          ],
        },
      },
    });
  };

  if (isLoading) return <div>Loading appointments...</div>;
  if (error) return <div>Error loading appointments: {error.message}</div>;

  return (
    <div>
      <h2>Appointments ({appointments?.length || 0})</h2>

      <div>
        <button onClick={handleCreateAppointment}>Create Appointment</button>
        <button onClick={handleSearchAvailability}>Search Availability</button>
      </div>

      {searchAvailability.data && (
        <div>
          <h3>Available Slots</h3>
          <pre>{JSON.stringify(searchAvailability.data, null, 2)}</pre>
        </div>
      )}

      <ul>
        {appointments?.map((appointment) => (
          <li key={appointment.id}>
            {appointment.startAt} - Status: {appointment.status}
            <button
              onClick={() =>
                handleUpdateAppointment(
                  appointment.id!,
                  appointment.version || 0
                )
              }
            >
              Update
            </button>
            <button
              onClick={() =>
                handleCancelAppointment(appointment.id!, appointment.version)
              }
            >
              Cancel
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
