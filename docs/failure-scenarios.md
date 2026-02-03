# Failure Scenarios & Resilience Strategy

## Overview
This document describes failure scenarios, expected system behavior,
and implemented mitigation strategies for the Event Booking Platform.

---

## 1. Kafka Broker Downtime

### Scenario
Kafka is unavailable while bookings are being created.

### Expected Behavior
- Booking API remains available
- Seat reservations and bookings are persisted
- Events are published once Kafka recovers
- No data loss

### Implementation
- Transactional Outbox Pattern
- Kafka publishing decoupled from request path
- Background publisher retries with backoff

### Recovery
- Restart Kafka
- Outbox publisher replays pending events

---

## 2. Redis Cache Failure

### Scenario
Redis becomes unavailable during reads or writes.

### Expected Behavior
- Requests fall back to database
- Cache errors are logged
- No request failures

### Implementation
- Cache-aside strategy
- Graceful Redis error handling
- Centralized cache invalidation

---

## 3. Database Connection Pool Exhaustion

### Scenario
High concurrency causes DB pool saturation.

### Expected Behavior
- System degrades gracefully
- Excess requests rejected with 503
- No cascading failures

### Implementation
- Connection pool limits
- Backpressure
- Circuit breaker

---

## 4. Duplicate Message Processing

### Scenario
Kafka delivers duplicate messages.

### Expected Behavior
- Messages processed exactly once
- No duplicate notifications

### Implementation
- Idempotency keys
- Unique DB constraints
- Consumer-side deduplication

---

## Observability

### Logs
kubectl logs -f deployment/booking-service
