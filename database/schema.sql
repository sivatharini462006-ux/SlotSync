-- ============================================================================
-- SlotSync Database Schema (MySQL 8.0+ / InnoDB)
-- Database: slotsync_db
-- ============================================================================

CREATE DATABASE IF NOT EXISTS slotsync_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE slotsync_db;

-- Disable foreign key checks temporarily during clean rebuild
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS audit_logs;
DROP TABLE IF EXISTS check_ins;
DROP TABLE IF EXISTS bookings;
DROP TABLE IF EXISTS resources;
DROP TABLE IF EXISTS floors;
DROP TABLE IF EXISTS resource_categories;
DROP TABLE IF EXISTS users;

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================================
-- TABLE 1: users
-- Stores Students, Faculty, and Administrators
-- ============================================================================
CREATE TABLE users (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('STUDENT', 'FACULTY', 'ADMIN') NOT NULL DEFAULT 'STUDENT',
  status ENUM('ACTIVE', 'SUSPENDED') NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_users_email (email),
  INDEX idx_users_role_status (role, status)
) ENGINE=InnoDB;

-- ============================================================================
-- TABLE 2: resource_categories
-- Normalized lookup table for resource types
-- ============================================================================
CREATE TABLE resource_categories (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  category_name ENUM(
    'LIBRARY_SEAT',
    'LAB_COMPUTER',
    'STUDY_ROOM',
    'PROJECTOR',
    'OTHER_EQUIPMENT'
  ) NOT NULL,
  description VARCHAR(255) NOT NULL,
  UNIQUE KEY uq_category_name (category_name)
) ENGINE=InnoDB;

-- ============================================================================
-- TABLE 3: floors
-- Normalized building & floor metadata for the Interactive Floor Map
-- ============================================================================
CREATE TABLE floors (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  building_name VARCHAR(100) NOT NULL,
  floor_number INT NOT NULL,
  floor_name VARCHAR(100) NOT NULL,
  UNIQUE KEY uq_building_floor (building_name, floor_number)
) ENGINE=InnoDB;

-- ============================================================================
-- TABLE 4: resources
-- Physical assets (Library seats, Lab PCs, Study rooms, Projectors, etc.)
-- ============================================================================
CREATE TABLE resources (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  resource_code VARCHAR(30) NOT NULL,
  resource_name VARCHAR(100) NOT NULL,
  resource_type ENUM(
    'LIBRARY_SEAT',
    'LAB_COMPUTER',
    'STUDY_ROOM',
    'PROJECTOR',
    'OTHER_EQUIPMENT'
  ) NOT NULL,
  description TEXT NULL,
  building VARCHAR(100) NOT NULL,
  floor_number INT NOT NULL,
  room_number VARCHAR(50) NOT NULL,
  capacity INT UNSIGNED NOT NULL DEFAULT 1,
  status ENUM('ACTIVE', 'INACTIVE', 'MAINTENANCE') NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_resource_code (resource_code),
  INDEX idx_resources_type_status (resource_type, status),
  INDEX idx_resources_floor (building, floor_number),
  CONSTRAINT fk_resources_category
    FOREIGN KEY (resource_type) REFERENCES resource_categories (category_name)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_resources_floor
    FOREIGN KEY (building, floor_number) REFERENCES floors (building_name, floor_number)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;

-- ============================================================================
-- TABLE 5: bookings
-- Core reservation ledger protected by row-level locking on `resources`
-- ============================================================================
CREATE TABLE bookings (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  resource_id INT UNSIGNED NOT NULL,
  booking_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  booking_code VARCHAR(32) NOT NULL,
  checkin_token_hash VARCHAR(255) NOT NULL,
  status ENUM(
    'PENDING',
    'CONFIRMED',
    'CHECKED_IN',
    'COMPLETED',
    'CANCELLED',
    'NO_SHOW'
  ) NOT NULL DEFAULT 'CONFIRMED',
  check_in_time DATETIME NULL,
  released_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_booking_code (booking_code),
  -- Composite index specifically optimized for overlap checks & availability queries
  INDEX idx_bookings_overlap (resource_id, booking_date, status, start_time, end_time),
  -- Index for node-cron 15-minute no-show scanner
  INDEX idx_bookings_noshow_scan (status, booking_date, start_time),
  INDEX idx_bookings_user (user_id, booking_date),
  CONSTRAINT fk_bookings_user
    FOREIGN KEY (user_id) REFERENCES users (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_bookings_resource
    FOREIGN KEY (resource_id) REFERENCES resources (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT chk_booking_time_order CHECK (start_time < end_time)
) ENGINE=InnoDB;

-- ============================================================================
-- TABLE 6: check_ins
-- Verification log for QR scans and manual booking-code check-ins
-- ============================================================================
CREATE TABLE check_ins (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  booking_id INT UNSIGNED NOT NULL,
  check_in_method ENUM('QR_SCAN', 'MANUAL_CODE') NOT NULL,
  checked_in_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_checkin_booking (booking_id),
  CONSTRAINT fk_checkins_booking
    FOREIGN KEY (booking_id) REFERENCES bookings (id)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================================
-- TABLE 7: audit_logs
-- Immutable trail of critical system & admin actions
-- ============================================================================
CREATE TABLE audit_logs (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NULL,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id INT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_audit_entity (entity_type, entity_id),
  INDEX idx_audit_user (user_id),
  CONSTRAINT fk_audit_user
    FOREIGN KEY (user_id) REFERENCES users (id)
    ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB;