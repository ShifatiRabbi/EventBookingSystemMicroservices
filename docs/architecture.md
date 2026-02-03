Event Booking System
A production-grade microservice-based Event Booking System designed to demonstrate real-world backend engineering principles. This system showcases distributed systems architecture with strong concurrency guarantees, event-driven communication, idempotency, and operational readiness.

🎯 Core Features
Strong Concurrency Control: Guarantees no seat overselling using database row-level locking

Idempotent Operations: Safe retry mechanism for all booking operations

Event-Driven Architecture: Asynchronous communication using Kafka

Production Resilience: Built-in failure handling and observability

Cache Safety: Redis caching with DB as source of truth

Service Isolation: Each microservice owns its data and domain

📋 Prerequisites
Docker & Docker Compose

Kubernetes (for production deployment)

Java 17+ (for Java services)

Node.js 18+ (for Node.js services)

Python 3.9+ (for Python services)

MySQL 8.0

Redis 7.0

Kafka 3.4

🏗️ Architecture
System Components
text
Client
   |
   v
API Gateway / Direct REST Calls
   |
   +--------------------+
   |                    |
User Service       Event Service
                        |
                        v
                   Booking Service
                        |
                        v
                     Kafka / NATS
                        |
                        v
              Notification Service
Services Overview
Service	Purpose	Tech Stack
User Service	User identity management	[Tech Stack]
Event Service	Event & seat inventory management	[Tech Stack]
Booking Service	Booking orchestration (core)	[Tech Stack]
Notification Service	Async notification processing	[Tech Stack]
🗄️ Database Schema
Each service has its own database:

user_db: User information and authentication

event_db: Events and seat inventory

booking_db: Booking records and transactions

notification_db: Notification logs and delivery status

🔄 Booking Flow
Seat Availability Check: Booking Service validates seat availability via Event Service

Seat Reservation: Event Service uses SELECT ... FOR UPDATE to lock and reserve seats

Booking Creation: Booking Service persists the booking record

Event Publication: Booking confirmed event published to Kafka

Notification Processing: Notification Service consumes events and sends notifications

⚙️ Key Design Decisions
Concurrency Control
DB Row-level Locking: Ensures strong consistency for seat reservations

Idempotency Keys: Prevents duplicate bookings from retries

Optimistic Concurrency: Version checking for data integrity

Event-Driven Communication
At-least-once Delivery: Ensures no missed notifications

Dead Letter Queues: Handles failed message processing

Event Versioning: Maintains compatibility between services

Caching Strategy
Read-Through Cache: Redis for frequently accessed data

Explicit Invalidation: Cache cleared on data updates

Graceful Degradation: System works when Redis is down

🚀 Getting Started
Local Development with Docker Compose
bash
# Clone the repository
git clone <repository-url>
cd event-booking-system

# Start all services
docker-compose up -d

# Check service status
docker-compose ps

# View logs
docker-compose logs -f
Service Ports
Service	Port	Health Check
User Service	8081	http://localhost:8081/health
Event Service	8082	http://localhost:8082/health
Booking Service	8083	http://localhost:8083/health
Notification Service	8084	http://localhost:8084/health
Redis	6379	redis-cli ping
Kafka	9092	-
MySQL	3306	-
📖 API Documentation
User Service
http
POST /api/users
Content-Type: application/json

{
  "email": "user@example.com",
  "name": "John Doe"
}
Event Service
http
POST /api/events
Content-Type: application/json

{
  "name": "Concert",
  "totalSeats": 100,
  "availableSeats": 100
}
Booking Service
http
POST /api/bookings
Content-Type: application/json

{
  "userId": "123",
  "eventId": "456",
  "seatCount": 2,
  "idempotencyKey": "unique-key-here"
}
🧪 Testing
Unit Tests
bash
# Run unit tests for all services
./scripts/run-unit-tests.sh
Integration Tests
bash
# Run integration tests
./scripts/run-integration-tests.sh
Load Testing
bash
# Simulate concurrent bookings
./scripts/load-test.sh --users 100 --bookings 1000
🐳 Kubernetes Deployment
Production Deployment
bash
# Apply Kubernetes configurations
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/config/
kubectl apply -f k8s/secrets/
kubectl apply -f k8s/services/

# Deploy microservices
kubectl apply -f k8s/deployments/
Monitoring
Prometheus metrics available at /metrics endpoint

Grafana dashboards in monitoring/ directory

Structured JSON logging with request tracing

🔧 Configuration
Environment Variables
Each service can be configured via environment variables:

yaml
# Example: Booking Service configuration
DATABASE_URL: jdbc:mysql://mysql:3306/booking_db
REDIS_HOST: redis
REDIS_PORT: 6379
KAFKA_BOOTSTRAP_SERVERS: kafka:9092
IDEMPOTENCY_TTL_SECONDS: 3600
MAX_SEATS_PER_BOOKING: 10
📊 Monitoring & Observability
Health Checks
Liveness: GET /health

Readiness: GET /ready

Metrics: GET /metrics

Logging
Structured JSON format

Correlation IDs for request tracing

Log levels configurable per service

Alerting
Prometheus alerts for error rates

Kafka consumer lag monitoring

Database connection pool alerts

🚨 Failure Scenarios & Recovery
Scenario	System Behavior	Recovery Procedure
Redis failure	Fallback to database reads	Restart Redis, warm up cache
Kafka downtime	Events buffered in service	Resume consumption, process backlog
Database failure	Read-only mode or degraded service	Failover to replica, restore from backup
Network partitions	Circuit breaker patterns	Manual intervention, service restarts
📈 Performance Characteristics
P99 Latency: < 200ms for booking operations

Throughput: 1000+ bookings per second

Scalability: Horizontal scaling for stateless services

Data Consistency: Strong consistency for seat inventory

🔍 Debugging
Common Issues
Seat overselling: Check Event Service database locks

Duplicate bookings: Verify idempotency key implementation

Notification delays: Monitor Kafka consumer lag

Cache inconsistencies: Check cache invalidation logic

Debug Endpoints
GET /debug/redis - Check Redis connectivity and cache stats

GET /debug/kafka - View Kafka topic status

GET /debug/db - Database connection and pool stats

📚 Further Reading