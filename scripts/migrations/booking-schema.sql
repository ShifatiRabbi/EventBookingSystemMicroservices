-- Booking Service Database

CREATE DATABASE IF NOT EXISTS booking_service;
USE booking_service;

CREATE TABLE bookings (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    booking_id VARCHAR(64) UNIQUE NOT NULL,
    event_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    seat_count INT NOT NULL CHECK (seat_count > 0),
    status ENUM('confirmed', 'cancelled') DEFAULT 'confirmed',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_event_user (event_id, user_id),
    INDEX idx_booking_id (booking_id)
);

CREATE TABLE booking_outbox (
  id CHAR(36) PRIMARY KEY,
  aggregate_id CHAR(36) NOT NULL,
  event_type VARCHAR(100) NOT NULL,
  payload JSON NOT NULL,
  status ENUM('pending','published','failed') DEFAULT 'pending',
  retries INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  published_at TIMESTAMP NULL
);

CREATE INDEX idx_outbox_status_created
ON booking_outbox (status, created_at);
