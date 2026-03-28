-- ShelfSense Reservation System Migration
-- Run this to upgrade the reservations table for the full queue system

USE shelfsense;

-- 1. Expand the status ENUM and add notification/expiry columns
ALTER TABLE reservations
  MODIFY COLUMN status ENUM('Active', 'Notified', 'Fulfilled', 'Expired', 'Cancelled') DEFAULT 'Active',
  ADD COLUMN notified_at DATETIME DEFAULT NULL AFTER status,
  ADD COLUMN expires_at DATETIME DEFAULT NULL AFTER notified_at;

-- 2. Add index on status for faster lookups
CREATE INDEX idx_reservations_status ON reservations(status);

-- 3. Add index for expiry checks
CREATE INDEX idx_reservations_expires ON reservations(expires_at);
