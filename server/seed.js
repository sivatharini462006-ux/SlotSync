require('dotenv').config();
const bcrypt = require('bcrypt');
const { pool } = require('./config/db');

async function seedDatabase() {
  console.log('🌱 Seeding SlotSync database with real bcrypt hashes...');

  try {
    const passwordHash = await bcrypt.hash('Password@123', 10);

    // 1. Seed Resource Categories
    await pool.query(`
      INSERT IGNORE INTO resource_categories (category_name, description) VALUES
        ('LIBRARY_SEAT', 'Individual quiet study desks and reading carrels in the Central Library'),
        ('LAB_COMPUTER', 'High-performance workstations in Computer Science & Engineering Labs'),
        ('STUDY_ROOM', 'Soundproof group discussion and collaborative project rooms'),
        ('PROJECTOR', 'Portable HD/4K digital projectors for seminars and classrooms'),
        ('OTHER_EQUIPMENT', 'Shared academic hardware such as smart boards, DSLR kits, and lab oscilloscopes')
    `);

    // 2. Seed Building Floors
    await pool.query(`
      INSERT IGNORE INTO floors (building_name, floor_number, floor_name) VALUES
        ('Central Library', 1, 'Ground Floor - Quiet Reading Hall'),
        ('Central Library', 2, 'First Floor - Group Study & Digital Zone'),
        ('Academic Block A', 1, 'Ground Floor - Seminar & Media Store'),
        ('Academic Block A', 2, 'Second Floor - Computer Labs Wing')
    `);

    // 3. Upsert Demo Users with REAL Password@123 hash
    const demoUsers = [
      ['System Administrator', 'admin@slotsync.edu', 'ADMIN'],
      ['Dr. Ananya Sharma', 'ananya.sharma@slotsync.edu', 'FACULTY'],
      ['Prof. Rajesh Verma', 'rajesh.verma@slotsync.edu', 'FACULTY'],
      ['Aarav Patel', 'aarav.student@slotsync.edu', 'STUDENT'],
      ['Priya Nair', 'priya.student@slotsync.edu', 'STUDENT'],
      ['Sivatharini M S', 'sivatharinims@gmail.com', 'STUDENT'],
    ];

    for (const [name, email, role] of demoUsers) {
      await pool.query(
        `INSERT INTO users (name, email, password_hash, role, status)
         VALUES (?, ?, ?, ?, 'ACTIVE')
         ON DUPLICATE KEY UPDATE
           name = VALUES(name),
           password_hash = VALUES(password_hash),
           role = VALUES(role),
           status = 'ACTIVE'`,
        [name, email, passwordHash, role]
      );
    }

    // 4. Upsert Sample Campus Resources
    const resources = [
      ['LIB001', 'Library Seat 01', 'LIBRARY_SEAT', 'Window-side reading desk with power outlet and task lamp', 'Central Library', 1, 'HALL-101', 1, 'ACTIVE'],
      ['LIB002', 'Library Seat 02', 'LIBRARY_SEAT', 'Quiet zone individual study desk near reference section', 'Central Library', 1, 'HALL-101', 1, 'ACTIVE'],
      ['LIB003', 'Library Seat 03', 'LIBRARY_SEAT', 'Ergonomic reading carrel with LAN port', 'Central Library', 1, 'HALL-101', 1, 'ACTIVE'],
      ['LIB004', 'Library Seat 04', 'LIBRARY_SEAT', 'Corner desk currently undergoing electrical socket repair', 'Central Library', 1, 'HALL-101', 1, 'MAINTENANCE'],
      ['LAB001', 'Computer System 01', 'LAB_COMPUTER', 'Intel i7 Workstation, 32GB RAM, Ubuntu/Windows Dual Boot, RTX GPU', 'Academic Block A', 2, 'LAB-201', 1, 'ACTIVE'],
      ['LAB002', 'Computer System 02', 'LAB_COMPUTER', 'Intel i7 Workstation, 32GB RAM, pre-installed with Docker, MySQL & VS Code', 'Academic Block A', 2, 'LAB-201', 1, 'ACTIVE'],
      ['LAB003', 'Computer System 03', 'LAB_COMPUTER', 'Intel i7 Workstation, 16GB RAM, Data Science & ML Toolkit', 'Academic Block A', 2, 'LAB-201', 1, 'ACTIVE'],
      ['ROOM001', 'Study Room 01', 'STUDY_ROOM', 'Acoustic glass group study room with 55-inch smart display & whiteboard', 'Central Library', 2, 'SR-201', 6, 'ACTIVE'],
      ['ROOM002', 'Study Room 02', 'STUDY_ROOM', 'Collaborative project room for capstone teams', 'Central Library', 2, 'SR-202', 8, 'ACTIVE'],
      ['PROJ001', 'Projector 01', 'PROJECTOR', 'Epson 4K Laser Portable Projector with HDMI & Wireless Casting', 'Academic Block A', 1, 'MEDIA-102', 1, 'ACTIVE'],
      ['PROJ002', 'Projector 02', 'PROJECTOR', 'BenQ Full HD Classroom Projector with Tripod Screen', 'Academic Block A', 1, 'MEDIA-102', 1, 'ACTIVE'],
      ['EQUIP001', 'Smart Interactive Board Kit', 'OTHER_EQUIPMENT', 'Portable digital whiteboard sensor and stylus set', 'Academic Block A', 1, 'MEDIA-102', 1, 'ACTIVE'],
    ];

    for (const r of resources) {
      await pool.query(
        `INSERT INTO resources (
          resource_code, resource_name, resource_type, description,
          building, floor_number, room_number, capacity, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          resource_name = VALUES(resource_name),
          status = VALUES(status)`,
        r
      );
    }

    console.log('✅ All demo accounts (Password@123) and 12 resources seeded successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed error:', err.message);
    process.exit(1);
  }
}

seedDatabase();