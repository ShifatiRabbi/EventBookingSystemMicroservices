# Event Schema Documentation

This document describes the event schemas used in the **Event Booking System**.  
These events are published to a message broker and consumed by downstream services
such as notifications, analytics, and seat management.

---

## Common Event Structure

All events follow a common envelope to support versioning and traceability.

| Field | Type | Description |
|------|------|-------------|
| `event` | string | Name of the event |
| `version` | string | Schema version |
| `timestamp` | ISO-8601 string | Time when the event was published |
| `data` | object | Event-specific payload |

---

## Booking Events

### Topic: `booking.confirmed`

Published when a booking is successfully created and seats are confirmed.

#### Schema Version
`1.0`

#### Payload Fields

| Field | Type | Description |
|------|------|-------------|
| `id` | uuid | Unique identifier for the booking event record |
| `booking_id` | string | Unique booking reference |
| `event_id` | uuid | Identifier of the booked event |
| `user_id` | uuid | Identifier of the user who made the booking |
| `seat_count` | integer | Number of seats booked |
| `status` | string | Booking status (`confirmed`) |
| `created_at` | timestamp | Time when the booking was created |
| `updated_at` | timestamp | Time when the booking was last updated |

#### Example
```json
{
  "event": "booking.confirmed",
  "version": "1.0",
  "timestamp": "2024-01-15T10:30:00Z",
  "data": {
    "id": "a1b2c3d4-e5f6-7890-abcd-1234567890ab",
    "booking_id": "BK-20240115-001",
    "event_id": "e7c9f8b1-3b9c-4a1e-9c9e-77f88c8a1234",
    "user_id": "u1234567-89ab-cdef-0123-456789abcdef",
    "seat_count": 2,
    "status": "confirmed",
    "created_at": "2024-01-15T10:29:50Z",
    "updated_at": "2024-01-15T10:30:00Z"
  }
}