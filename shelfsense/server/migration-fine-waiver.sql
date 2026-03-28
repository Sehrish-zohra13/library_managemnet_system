-- Fine Waiver System Migration
-- Run this to add admin_note support to existing fine_requests table

USE shelfsense;

-- Add admin_note column for admin feedback on waiver decisions
ALTER TABLE fine_requests
  ADD COLUMN admin_note TEXT DEFAULT NULL AFTER status,
  ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at;

-- Add index for faster lookups by status
CREATE INDEX idx_fine_requests_status ON fine_requests(status);
CREATE INDEX idx_fine_requests_user ON fine_requests(user_id);
