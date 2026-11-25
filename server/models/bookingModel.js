const { pool } = require('../config/db');

/**
 * Fetch all bookings for a specific user (upcoming + history)
 */
const getBookingsByUserId = async (userId, { status, timeframe } = {}) => {
  const params = [userId];
  let query = `
    SELECT
      b.id,
      b.user_id,
      b.resource_id,
      b.booking_date,
      b.start_time,
      b.end_time,
      b.booking_code,
      b.status,
      b.check_in_time,
      b.released_at,
      b.created_at,
      r.resource_code,
      r.resource_name,
      r.resource_type,
      r.building,
      r.floor_number,
      r.room_number
    FROM bookings b
    INNER JOIN resources r ON b.resource_id = r.id
    WHERE b.user_id = ?
  `;

  if (status) {
    query += ` AND b.status = ?`;
    params.push(status.toUpperCase());
  }

  if (timeframe === 'upcoming') {
    query += ` AND (b.booking_date > CURDATE() OR (b.booking_date = CURDATE() AND b.end_time >= CURTIME()))
               AND b.status IN ('PENDING', 'CONFIRMED', 'CHECKED_IN')`;
  } else if (timeframe === 'history') {
    query += ` AND (b.booking_date < CURDATE() OR (b.booking_date = CURDATE() AND b.end_time < CURTIME())
               OR b.status IN ('COMPLETED', 'CANCELLED', 'NO_SHOW'))`;
  }

  query += ` ORDER BY b.booking_date DESC, b.start_time DESC`;

  const [rows] = await pool.execute(query, params);
  return rows;
};

/**
 * Fetch all bookings across the system (for Admin / overview queries)
 */
const getAllBookings = async ({ status, date, resourceId } = {}) => {
  const params = [];
  let query = `
    SELECT
      b.id,
      b.user_id,
      u.name AS user_name,
      u.email AS user_email,
      u.role AS user_role,
      b.resource_id,
      r.resource_code,
      r.resource_name,
      r.resource_type,
      r.building,
      r.floor_number,
      r.room_number,
      b.booking_date,
      b.start_time,
      b.end_time,
      b.booking_code,
      b.status,
      b.check_in_time,
      b.released_at,
      b.created_at
    FROM bookings b
    INNER JOIN users u ON b.user_id = u.id
    INNER JOIN resources r ON b.resource_id = r.id
    WHERE 1 = 1
  `;

  if (status) {
    query += ` AND b.status = ?`;
    params.push(status.toUpperCase());
  }

  if (date) {
    query += ` AND b.booking_date = ?`;
    params.push(date);
  }

  if (resourceId) {
    query += ` AND b.resource_id = ?`;
    params.push(Number(resourceId));
  }

  query += ` ORDER BY b.booking_date DESC, b.start_time DESC`;

  const [rows] = await pool.execute(query, params);
  return rows;
};

/**
 * Fetch a single booking by ID with resource and user metadata
 */
const getBookingById = async (id) => {
  const [rows] = await pool.execute(
    `SELECT
       b.*,
       u.name AS user_name,
       u.email AS user_email,
       u.role AS user_role,
       r.resource_code,
       r.resource_name,
       r.resource_type,
       r.building,
       r.floor_number,
       r.room_number
     FROM bookings b
     INNER JOIN users u ON b.user_id = u.id
     INNER JOIN resources r ON b.resource_id = r.id
     WHERE b.id = ?
     LIMIT 1`,
    [id]
  );
  return rows[0] || null;
};

module.exports = {
  getBookingsByUserId,
  getAllBookings,
  getBookingById,
};