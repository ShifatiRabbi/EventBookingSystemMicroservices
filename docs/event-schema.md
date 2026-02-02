# Event Schema Documentation

## Booking Events

### Topic: `booking.confirmed`
json
{
  "event": "booking.confirmed",
  "version": "1.0",
  "timestamp": "2024-01-15T10:30:00Z",
  "data": {
    "id": "uuid",
    "booking_id": "string (unique)",
    "event_id": "uuid",
    "user_id": "uuid",
    "seat_count": "integer",
    "status": "confirmed",
    "created_at": "timestamp",
    "updated_at": "timestamp"
  }
}

### Topic: booking.cancelled
json
{
  "event": "booking.cancelled",
  "version": "1.0",
  "timestamp": "2024-01-15T10:30:00Z",
  "data": {
    "booking_id": "string",
    "event_id": "uuid",
    "user_id": "uuid",
    "seat_count": "integer",
    "cancelled_at": "timestamp"
  }
}

## DLQ Events
### Topic: booking.confirmed.dlq
json
{
  "originalMessage": "original event JSON",
  "error": "error message",
  "failedAt": "timestamp",
  "retryCount": "integer",
  "service": "notification-service"
}


Cache Keys
Event Service Cache:
text
event:{eventId}           // Single event (TTL: 60s)
events:list              // All events list (TTL: 30s)
events:available:{date}  // Available events by date (TTL: 60s)
Cache Invalidation Triggers:
Event update (PATCH /api/events/{id})

Seat reservation (POST /api/events/{id}/reserve)

Event creation (clears list cache)

text

---

### **File 5: Package.json for Load Test**
**Location:** `scripts/load-test/package.json`

```json
{
  "name": "event-booking-load-test",
  "version": "1.0.0",
  "description": "Load testing for event booking system",
  "main": "booking-concurrency.js",
  "scripts": {
    "test:load": "node booking-concurrency.js",
    "test:stress": "node stress-test.js",
    "test:validation": "node validate-consistency.js"
  },
  "dependencies": {
    "autocannon": "^7.10.0",
    "axios": "^1.6.2",
    "chalk": "^4.1.2"
  }
}