# Appointments API Documentation

This document describes the Appointments API implementation using Square's Bookings API and TanStack Query.

## Setup

### Environment Variables

Add the following to your `.env` file:

```env
SQUARE_ACCESS_TOKEN=your_square_access_token
SQUARE_ENVIRONMENT=sandbox # or production
```

## API Endpoints

### List Appointments
**GET** `/api/appointments`

Query parameters:
- `limit` (number, max 100): Number of appointments to return (default: 20)
- `cursor` (string): Pagination cursor
- `customer_id` (string): Filter by customer ID
- `team_member_id` (string): Filter by team member ID
- `location_id` (string): Filter by location ID
- `start_at_min` (string): ISO 8601 datetime - minimum start time
- `start_at_max` (string): ISO 8601 datetime - maximum start time

Example:
```
GET /api/appointments?limit=10&location_id=L123&start_at_min=2024-11-06T00:00:00Z
```

### Get Single Appointment
**GET** `/api/appointments/[id]`

Returns a single appointment by ID.

### Create Appointment
**POST** `/api/appointments`

Request body:
```json
{
  "startAt": "2024-11-07T10:00:00Z",
  "locationId": "L123",
  "customerId": "C456",
  "customerNote": "Please bring documents",
  "sellerNote": "First time client",
  "appointmentSegments": [
    {
      "durationMinutes": 60,
      "serviceVariationId": "SV789",
      "teamMemberId": "TM012"
    }
  ]
}
```

### Update Appointment
**PUT** `/api/appointments/[id]`

Request body (all fields optional except version):
```json
{
  "version": 1,
  "startAt": "2024-11-07T11:00:00Z",
  "customerNote": "Updated note"
}
```

### Cancel Appointment
**DELETE** `/api/appointments/[id]`

Query parameters:
- `booking_version` (number): Optional booking version for optimistic locking

### Search Availability
**POST** `/api/appointments/search-availability`

Request body:
```json
{
  "query": {
    "filter": {
      "startAtRange": {
        "startAt": "2024-11-06T00:00:00Z",
        "endAt": "2024-11-13T00:00:00Z"
      },
      "locationId": "L123",
      "segmentFilters": [
        {
          "serviceVariationId": "SV789"
        }
      ]
    }
  }
}
```

## React Hooks

### useAppointments

Fetch appointments with optional filters.

```typescript
import { useAppointments } from '@/lib/hooks/use-appointments';

function MyComponent() {
  const { data, isLoading, error } = useAppointments({
    limit: 10,
    locationId: 'L123',
    startAtMin: new Date().toISOString(),
  });

  return (
    <div>
      {data?.map(appointment => (
        <div key={appointment.id}>{appointment.startAt}</div>
      ))}
    </div>
  );
}
```

### useAppointment

Fetch a single appointment by ID.

```typescript
const { data: appointment } = useAppointment('APPOINTMENT_ID');
```

### useCreateAppointment

Create a new appointment.

```typescript
const createAppointment = useCreateAppointment();

createAppointment.mutate({
  startAt: '2024-11-07T10:00:00Z',
  locationId: 'L123',
  appointmentSegments: [{
    durationMinutes: 60,
    serviceVariationId: 'SV789',
    teamMemberId: 'TM012',
  }],
});
```

### useUpdateAppointment

Update an existing appointment.

```typescript
const updateAppointment = useUpdateAppointment();

updateAppointment.mutate({
  id: 'APPOINTMENT_ID',
  data: {
    startAt: '2024-11-07T11:00:00Z',
    version: 1,
  },
});
```

### useCancelAppointment

Cancel an appointment.

```typescript
const cancelAppointment = useCancelAppointment();

cancelAppointment.mutate({
  id: 'APPOINTMENT_ID',
  bookingVersion: 1,
});
```

### useSearchAvailability

Search for available time slots.

```typescript
const searchAvailability = useSearchAvailability();

searchAvailability.mutate({
  query: {
    filter: {
      startAtRange: {
        startAt: new Date().toISOString(),
        endAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      },
      locationId: 'L123',
    },
  },
});

// Access results
if (searchAvailability.data) {
  console.log(searchAvailability.data.availabilities);
}
```

## Types

### Appointment
Re-exported from Square SDK as `Booking` type.

### CreateAppointmentInput
```typescript
{
  startAt: string;
  locationId: string;
  customerId?: string;
  customerNote?: string;
  sellerNote?: string;
  appointmentSegments: Array<{
    durationMinutes: number;
    serviceVariationId: string;
    teamMemberId: string;
  }>;
}
```

### ListAppointmentsParams
```typescript
{
  limit?: number;
  cursor?: string;
  customerId?: string;
  teamMemberId?: string;
  locationId?: string;
  startAtMin?: string;
  startAtMax?: string;
}
```

## Error Handling

All API endpoints return standardized error responses:

```typescript
{
  success: false;
  error: string;
  message: string;
}
```

All hooks automatically handle errors through TanStack Query's error handling system.

## Notes

- All datetime values should be in ISO 8601 format
- BigInt values are automatically serialized to strings for JSON compatibility
- The API uses Square's sandbox environment by default (configure via `SQUARE_ENVIRONMENT`)
- Optimistic locking is supported via the `version` field when updating appointments
