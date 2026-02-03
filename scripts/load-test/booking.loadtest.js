const autocannon = require('autocannon');
const { randomBytes } = require('crypto');

// ================== CONFIG ==================
const BASE_URL = 'http://localhost:3003';
const BOOKING_ENDPOINT = '/api/bookings';

const EVENT_ID = 'your-test-event-id'; // must exist
const CONCURRENCY = 50;
const DURATION = 30; // seconds
const TOTAL_USERS = 100;
// ============================================

// Create test users
function createTestUsers(num) {
  return Array.from({ length: num }, (_, i) => ({
    id: `user-${i}`,
    name: `Test User ${i}`,
    email: `test${i}@example.com`,
  }));
}

// Generate booking payload
function generateBookingPayload(userId, reuseKey = false) {
  return {
    eventId: EVENT_ID,
    userId,
    seatCount: Math.floor(Math.random() * 3) + 1,
    idempotencyKey: reuseKey
      ? `fixed-key-${userId}` // used to test retries
      : randomBytes(16).toString('hex'),
  };
}

async function runLoadTest() {
  console.log(' Starting Booking Load Test');
  console.log(`Target: ${BASE_URL}${BOOKING_ENDPOINT}`);
  console.log(`Concurrency: ${CONCURRENCY}`);
  console.log(`Duration: ${DURATION}s\n`);

  const users = createTestUsers(TOTAL_USERS);

  const instance = autocannon({
    url: `${BASE_URL}${BOOKING_ENDPOINT}`,
    method: 'POST',
    connections: CONCURRENCY,
    pipelining: 1,
    duration: DURATION,

    setupClient: (client) => {
      const user = users[Math.floor(Math.random() * users.length)];

      client.setHeaders({
        'content-type': 'application/json',
        'x-request-id': randomBytes(8).toString('hex'),
      });

      // 20% of requests reuse idempotency key
      const reuseKey = Math.random() < 0.2;

      client.setBody(
        JSON.stringify(generateBookingPayload(user.id, reuseKey))
      );
    },
  });

  autocannon.track(instance, { renderProgressBar: true });

  instance.on('done', (result) => {
    console.log('\n Load Test Results');
    console.log('====================');
    console.log(`Total Requests: ${result.requests.total}`);
    console.log(`Total Errors: ${result.errors}`);
    console.log(`Avg Latency: ${result.latency.average} ms`);
    console.log(`p99 Latency: ${result.latency.p99} ms`);
    console.log(`Throughput: ${result.throughput.average} req/sec`);

    console.log('\n Post-Test Checks');
    console.log('1. Event-service seat count');
    console.log('2. Booking count vs seats reserved');
    console.log('3. No negative seat values');
    console.log('4. No duplicate bookings for same idempotency key');

    process.exit(0);
  });

  instance.on('error', (err) => {
    console.error(' Load test failed:', err);
    process.exit(1);
  });
}

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n Load test interrupted');
  process.exit(0);
});

runLoadTest();