const crypto = require('crypto');
const { pool } = require('../config/db');
const { emitLiveUpdate } = require('../utils/socketManager');

const generateBookingCode = () =>
  `SS-${new Date().getFullYear()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

const generateCheckinHash = (code) =>
  crypto.createHash('sha256').update(`${code}-${process.env.JWT_SECRET || 'slotsync'}`).digest('hex');

const joinWaitlist = async ({ userId, resourceId, bookingDate, startTime, endTime }) => {
  const [existing] = await pool.execute(
    `SELECT id FROM waitlist
     WHERE user_id = ? AND resource_id = ? AND booking_date = ? AND status = 'WAITING'
       AND start_time < ? AND end_time > ?`,
    [userId, resourceId, bookingDate, endTime, startTime]
  );

  if (existing.length > 0) {
    throw Object.assign(new Error('You are already on the waitlist for this time slot.'), {
      statusCode: 409,
    });
  }

  const [result] = await pool.execute(
    `INSERT INTO waitlist (user_id, resource_id, booking_date, start_time, end_time, status)
     VALUES (?, ?, ?, ?, ?, 'WAITING')`,
    [userId, resourceId, bookingDate, startTime, endTime]
  );

  const [positionRows] = await pool.execute(
    `SELECT COUNT(*) AS position FROM waitlist
     WHERE resource_id = ? AND booking_date = ? AND status = 'WAITING'
       AND start_time < ? AND end_time > ? AND id <= ?`,
    [resourceId, bookingDate, endTime, startTime, result.insertId]
  );

  const queuePosition = positionRows[0]?.position || 1;

  await pool.execute(
    `INSERT INTO audit_logs (user_id, action, entity_type, entity_id)
     VALUES (?, 'WAITLIST_JOINED', 'WAITLIST', ?)`,
    [userId, result.insertId]
  );

  emitLiveUpdate('WAITLIST_UPDATED', {
    resourceId: Number(resourceId),
    waitlistId: result.insertId,
    queuePosition,
    message: `New user joined waitlist (Position #${queuePosition}) for Resource #${resourceId}.`,
  });

  return {
    id: result.insertId,
    resource_id: Number(resourceId),
    booking_date: bookingDate,
    start_time: startTime,
    end_time: endTime,
    queue_position: queuePosition,
    status: 'WAITING',
  };
};

const promoteNextInWaitlist = async ({ resourceId, bookingDate, startTime, endTime }) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [resources] = await connection.execute(
      'SELECT id, resource_name, status FROM resources WHERE id = ? FOR UPDATE',
      [resourceId]
    );

    if (resources.length === 0 || resources[0].status !== 'ACTIVE') {
      await connection.rollback();
      return null;
    }

    const resource = resources[0];

    const [candidates] = await connection.execute(
      `SELECT w.*, u.name AS user_name, u.email AS user_email
       FROM waitlist w
       JOIN users u ON w.user_id = u.id
       WHERE w.resource_id = ?
         AND w.booking_date = ?
         AND w.status = 'WAITING'
         AND w.start_time < ?
         AND w.end_time > ?
         AND TIMESTAMP(w.booking_date, w.end_time) > NOW()
       ORDER BY w.created_at ASC, w.id ASC
       LIMIT 1
       FOR UPDATE`,
      [resourceId, bookingDate, endTime, startTime]
    );

    if (candidates.length === 0) {
      await connection.commit();
      return null;
    }

    const nextPerson = candidates[0];

    const [conflicts] = await connection.execute(
      `SELECT id FROM bookings
       WHERE resource_id = ?
         AND booking_date = ?
         AND status IN ('CONFIRMED', 'CHECKED_IN')
         AND start_time < ?
         AND end_time > ?
       FOR UPDATE`,
      [resourceId, bookingDate, nextPerson.end_time, nextPerson.start_time]
    );

    if (conflicts.length > 0) {
      await connection.commit();
      return null;
    }

    const bookingCode = generateBookingCode();
    const checkinTokenHash = generateCheckinHash(bookingCode);

    const [bookingInsert] = await connection.execute(
      `INSERT INTO bookings (user_id, resource_id, booking_date, start_time, end_time, booking_code, checkin_token_hash, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'CONFIRMED')`,
      [
        nextPerson.user_id,
        resourceId,
        bookingDate,
        nextPerson.start_time,
        nextPerson.end_time,
        bookingCode,
        checkinTokenHash,
      ]
    );

    const promotedBookingId = bookingInsert.insertId;

    await connection.execute(
      `UPDATE waitlist
       SET status = 'PROMOTED', promoted_booking_id = ?
       WHERE id = ?`,
      [promotedBookingId, nextPerson.id]
    );

    await connection.execute(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id)
       VALUES (?, 'WAITLIST_AUTO_PROMOTED', 'BOOKING', ?)`,
      [nextPerson.user_id, promotedBookingId]
    );

    await connection.commit();

    emitLiveUpdate('WAITLIST_PROMOTED', {
      resourceId: Number(resourceId),
      resourceName: resource.resource_name,
      promotedUserId: nextPerson.user_id,
      promotedUserName: nextPerson.user_name,
      bookingId: promotedBookingId,
      status: 'RESERVED',
      message: `⚡ Auto-Promoted ${nextPerson.user_name} from waitlist into ${resource.resource_name}!`,
    });

    return {
      waitlistId: nextPerson.id,
      bookingId: promotedBookingId,
      bookingCode,
      userId: nextPerson.user_id,
      userName: nextPerson.user_name,
      resourceName: resource.resource_name,
    };
  } catch (err) {
    await connection.rollback();
    console.error('❌ Waitlist Auto-Promotion Error:', err.message);
    return null;
  } finally {
    connection.release();
  }
};

const getUserWaitlist = async (userId) => {
  const [rows] = await pool.execute(
    `SELECT w.*, r.resource_name, r.resource_code, r.resource_type, r.building, r.floor_number,
            (
              SELECT COUNT(*) FROM waitlist w2
              WHERE w2.resource_id = w.resource_id
                AND w2.booking_date = w.booking_date
                AND w2.status = 'WAITING'
                AND w2.start_time < w.end_time
                AND w2.end_time > w.start_time
                AND w2.id <= w.id
            ) AS queue_position
     FROM waitlist w
     JOIN resources r ON w.resource_id = r.id
     WHERE w.user_id = ?
     ORDER BY w.created_at DESC`,
    [userId]
  );

  return rows;
};

const leaveWaitlist = async (waitlistId, userId) => {
  const [result] = await pool.execute(
    `UPDATE waitlist
     SET status = 'CANCELLED'
     WHERE id = ? AND user_id = ? AND status = 'WAITING'`,
    [waitlistId, userId]
  );

  if (result.affectedRows === 0) {
    throw Object.assign(new Error('Active waitlist entry not found.'), { statusCode: 404 });
  }

  return true;
};

module.exports = {
  joinWaitlist,
  promoteNextInWaitlist,
  getUserWaitlist,
  leaveWaitlist,
};