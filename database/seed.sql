-- ============================================================================
-- SlotSync Seed Data (Development & Testing)
-- Default Password for all sample users: Password@123
-- ============================================================================

USE slotsync_db;

-- 1. Seed Resource Categories
INSERT INTO resource_categories (category_name, description) VALUES
  ('LIBRARY_SEAT', 'Individual quiet study desks and reading carrels in the Central Library'),
  ('LAB_COMPUTER', 'High-performance workstations in Computer Science & Engineering Labs'),
  ('STUDY_ROOM', 'Soundproof group discussion and collaborative project rooms'),
  ('PROJECTOR', 'Portable HD/4K digital projectors for seminars and classrooms'),
  ('OTHER_EQUIPMENT', 'Shared academic hardware such as smart boards, DSLR kits, and lab oscilloscopes');

-- 2. Seed Building Floors
INSERT INTO floors (building_name, floor_number, floor_name) VALUES
  ('Central Library', 1, 'Ground Floor - Quiet Reading Hall'),
  ('Central Library', 2, 'First Floor - Group Study & Digital Zone'),
  ('Academic Block A', 1, 'Ground Floor - Seminar & Media Store'),
  ('Academic Block A', 2, 'Second Floor - Computer Labs Wing');

-- 3. Seed Sample Users (Password: Password@123)
-- bcrypt hash below corresponds to "Password@123"
INSERT INTO users (name, email, password_hash, role, status) VALUES
  ('System Administrator', 'admin@slotsync.edu', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'ADMIN', 'ACTIVE'),
  ('Dr. Ananya Sharma', 'ananya.sharma@slotsync.edu', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'FACULTY', 'ACTIVE'),
  ('Prof. Rajesh Verma', 'rajesh.verma@slotsync.edu', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'FACULTY', 'ACTIVE'),
  ('Aarav Patel', 'aarav.student@slotsync.edu', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'STUDENT', 'ACTIVE'),
  ('Priya Nair', 'priya.student@slotsync.edu', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'STUDENT', 'ACTIVE'),
  ('Rohan Kulkarni', 'rohan.student@slotsync.edu', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'STUDENT', 'ACTIVE');

-- 4. Seed Sample Resources
INSERT INTO resources (
  resource_code, resource_name, resource_type, description,
  building, floor_number, room_number, capacity, status
) VALUES
  ('LIB001', 'Library Seat 01', 'LIBRARY_SEAT', 'Window-side reading desk with power outlet and task lamp', 'Central Library', 1, 'HALL-101', 1, 'ACTIVE'),
  ('LIB002', 'Library Seat 02', 'LIBRARY_SEAT', 'Quiet zone individual study desk near reference section', 'Central Library', 1, 'HALL-101', 1, 'ACTIVE'),
  ('LIB003', 'Library Seat 03', 'LIBRARY_SEAT', 'Ergonomic reading carrel with LAN port', 'Central Library', 1, 'HALL-101', 1, 'ACTIVE'),
  ('LIB004', 'Library Seat 04', 'LIBRARY_SEAT', 'Corner desk currently undergoing electrical socket repair', 'Central Library', 1, 'HALL-101', 1, 'MAINTENANCE'),
  ('LAB001', 'Computer System 01', 'LAB_COMPUTER', 'Intel i7 Workstation, 32GB RAM, Ubuntu/Windows Dual Boot, RTX GPU', 'Academic Block A', 2, 'LAB-201', 1, 'ACTIVE'),
  ('LAB002', 'Computer System 02', 'LAB_COMPUTER', 'Intel i7 Workstation, 32GB RAM, pre-installed with Docker, MySQL & VS Code', 'Academic Block A', 2, 'LAB-201', 1, 'ACTIVE'),
  ('LAB003', 'Computer System 03', 'LAB_COMPUTER', 'Intel i7 Workstation, 16GB RAM, Data Science & ML Toolkit', 'Academic Block A', 2, 'LAB-201', 1, 'ACTIVE'),
  ('ROOM001', 'Study Room 01', 'STUDY_ROOM', 'Acoustic glass group study room with 55-inch smart display & whiteboard', 'Central Library', 2, 'SR-201', 6, 'ACTIVE'),
  ('ROOM002', 'Study Room 02', 'STUDY_ROOM', 'Collaborative project room for capstone teams', 'Central Library', 2, 'SR-202', 8, 'ACTIVE'),
  ('PROJ001', 'Projector 01', 'PROJECTOR', 'Epson 4K Laser Portable Projector with HDMI & Wireless Casting', 'Academic Block A', 1, 'MEDIA-102', 1, 'ACTIVE'),
  ('PROJ002', 'Projector 02', 'PROJECTOR', 'BenQ Full HD Classroom Projector with Tripod Screen', 'Academic Block A', 1, 'MEDIA-102', 1, 'ACTIVE'),
  ('EQUIP001', 'Smart Interactive Board Kit', 'OTHER_EQUIPMENT', 'Portable digital whiteboard sensor and stylus set', 'Academic Block A', 1, 'MEDIA-102', 1, 'ACTIVE');

-- 5. Seed Sample Bookings (Using CURDATE() + 1 day so sample bookings are always upcoming)
INSERT INTO bookings (
  user_id, resource_id, booking_date, start_time, end_time,
  booking_code, checkin_token_hash, status
) VALUES
  (4, 1, DATE_ADD(CURDATE(), INTERVAL 1 DAY), '09:00:00', '11:00:00', 'SYNC-DEMO-1001', 'sample_sha256_token_hash_001', 'CONFIRMED'),
  (5, 5, DATE_ADD(CURDATE(), INTERVAL 1 DAY), '10:00:00', '12:00:00', 'SYNC-DEMO-1002', 'sample_sha256_token_hash_002', 'CONFIRMED'),
  (2, 10, DATE_ADD(CURDATE(), INTERVAL 1 DAY), '14:00:00', '16:00:00', 'SYNC-DEMO-1003', 'sample_sha256_token_hash_003', 'CONFIRMED'),
  (6, 8, DATE_SUB(CURDATE(), INTERVAL 1 DAY), '11:00:00', '13:00:00', 'SYNC-DEMO-1004', 'sample_sha256_token_hash_004', 'COMPLETED');

-- 6. Seed Initial Audit Log
INSERT INTO audit_logs (user_id, action, entity_type, entity_id) VALUES
  (1, 'DATABASE_INITIALIZED', 'SYSTEM', 1);