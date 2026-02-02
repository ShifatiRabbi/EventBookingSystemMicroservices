# Failure Scenarios and Handling

## Scenario 1: Kafka Broker Temporary Downtime

### Test Setup:
1. Start all services
2. Create a test event with 100 seats
3. Stop Kafka broker: `kubectl scale deployment kafka --replicas=0`
4. Attempt to create 10 bookings
5. Restart Kafka: `kubectl scale deployment kafka --replicas=1`

### Expected Behavior:
- Booking Service: Should accept bookings and store them in DB
- Booking Service: Should queue failed Kafka messages (needs retry mechanism)
- Notification Service: Should process backlog when Kafka is restored

### Implementation Needed:
Add retry mechanism to booking producer:

typescript
// Add to booking.producer.ts
export const publishBookingConfirmed = async (booking: any, retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      if (!isConnected) {
        await producer.connect();
        isConnected = true;
      }
      
      await producer.send({
        topic: "booking.confirmed",
        messages: [{
          key: booking.booking_id,
          value: JSON.stringify({
            event: "booking.confirmed",
            version: "1.0",
            timestamp: new Date().toISOString(),
            data: booking,
          }),
        }],
      });
      
      logger.info("Booking event published", { bookingId: booking.booking_id });
      return;
    } catch (error) {
      logger.error(`Failed to publish booking event (attempt ${i + 1}/${retries})`, {
        bookingId: booking.booking_id,
        error: error.message,
      });
      
      if (i < retries - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i))); // Exponential backoff
      }
    }
  }
  
  // Fallback: Store in dead letter queue table
  await storeFailedEvent(booking);
};








## Scenario 2: Redis Cache Failure
Test Setup:
Start all services

Fetch an event multiple times (should cache)

Stop Redis: kubectl scale deployment redis --replicas=0

Fetch same event

Update the event

Restart Redis

Expected Behavior:
Event Service: Should fall back to DB when Redis is unavailable

Event Service: Should log cache failures but not fail requests

System should continue functioning (degraded performance)

Current Implementation:
The cache controller already handles Redis errors gracefully by proceeding to DB.

## Scenario 3: Database Connection Pool Exhaustion
Test Setup:
Simulate high concurrency booking requests (1000+ concurrent).

Mitigation Strategy:
Connection pooling with limits

Circuit breaker pattern

Queue overflow handling

## Scenario 4: Duplicate Message Processing
Already Implemented:
Idempotency keys in booking service

Message ID deduplication in notification service

Database unique constraints

Verification Commands:
# Monitor logs during failure
kubectl logs -f deployment/booking-service --tail=50

# Check event seat consistency
curl http://localhost:3002/api/events/{eventId}

# Check booking count
curl http://localhost:3003/api/bookings

# Verify no negative seats
mysql -h localhost -u root -p -e "SELECT * FROM event_service.events WHERE available_seats < 0;"


Recovery Procedures:
Kafka Message Replay:
# Check DLQ topics
kafka-console-consumer --bootstrap-server localhost:9092 --topic booking.confirmed.dlq

# Manual replay script available in scripts/replay-dlq.js
Cache Warm-up:
# Warm cache after Redis restart
curl http://localhost:3002/api/events

Data Consistency Check:
-- Verify seat consistency
SELECT 
  e.id,
  e.title,
  e.total_seats,
  e.available_seats,
  SUM(b.seat_count) as booked_seats,
  e.total_seats - e.available_seats as calculated_booked,
  CASE 
    WHEN e.available_seats < 0 THEN 'OVERBOOKED'
    WHEN e.total_seats - e.available_seats != SUM(b.seat_count) THEN 'INCONSISTENT'
    ELSE 'OK'
  END as status
FROM event_service.events e
LEFT JOIN booking_service.bookings b ON e.id = b.event_id AND b.status = 'confirmed'
GROUP BY e.id;


---

### **File 3: Enhanced Cache Controller with Better Invalidation**
**Location:** `services/event/controllers/cache.controller.ts` (Update)

```typescript
import redisClient from "../cache/redis";
import logger from "../logs/logger";

export const cacheController = (keyPrefix: string, ttl = 60) => {
  return async (req: any, res: any, next: Function) => {
    const key = `${keyPrefix}:${req.params.id}`;
    const requestId = req.requestId;

    try {
      // Check cache
      const cached = await redisClient.get(key);

      if (cached) {
        logger.info("Cache hit", { 
          requestId, 
          key, 
          source: 'redis' 
        });
        
        const data = JSON.parse(cached);
        
        // Add cache header for debugging
        res.set('X-Cache', 'HIT');
        res.set('X-Cache-Key', key);
        res.set('X-Cache-TTL', ttl.toString());
        
        return res.json(data);
      }

      // Cache miss - proceed to handler
      logger.info("Cache miss", { 
        requestId, 
        key, 
        source: 'database' 
      });

      const originalJson = res.json.bind(res);
      
      res.json = (data: any) => {
        // Only cache successful responses
        if (res.statusCode >= 200 && res.statusCode < 300) {
          // Cache with TTL
          redisClient.setEx(key, ttl, JSON.stringify(data))
            .then(() => {
              logger.info("Cache set", { 
                requestId, 
                key, 
                ttl 
              });
            })
            .catch(err => {
              logger.error("Cache set failed", { 
                requestId, 
                key, 
                error: err.message 
              });
              // Don't fail the request if cache fails
            });
        }
        
        // Add cache header
        res.set('X-Cache', 'MISS');
        
        return originalJson(data);
      };

      next();
    } catch (error: any) {
      logger.error("Cache middleware error", { 
        requestId, 
        key, 
        error: error.message 
      });
      
      // Continue without caching
      res.set('X-Cache', 'ERROR');
      next();
    }
  };
};

// Enhanced cache invalidation
export const invalidateCache = async (pattern: string) => {
  try {
    const keys = await redisClient.keys(pattern);
    
    if (keys.length > 0) {
      await redisClient.del(keys);
      logger.info("Cache invalidated", { 
        pattern, 
        keysCount: keys.length,
        keys: keys.slice(0, 5) // Log first 5 keys
      });
    }
    
    return keys.length;
  } catch (error: any) {
    logger.error("Cache invalidation failed", { 
      pattern, 
      error: error.message 
    });
    return 0;
  }
};

// Cache warming utility
export const warmCache = async (key: string, data: any, ttl: number) => {
  try {
    await redisClient.setEx(key, ttl, JSON.stringify(data));
    logger.info("Cache warmed", { key, ttl });
    return true;
  } catch (error: any) {
    logger.error("Cache warming failed", { key, error: error.message });
    return false;
  }
};