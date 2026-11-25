const crypto = require('crypto');
const { pool } = require('../config/db');
const { emitLiveUpdate } = require('../utils/socketManager');
const { logAudit } = require('../utils/auditLogger');

/**
 * Add a user to the FIFO waitlist for an occupied resource time slot
 */
const joinWaitlist = async ({ userId, resourceId, startTime, endTime, purpose }) => {
  const [existing] = await pool.execute(
    `SELECT id FROM waitlist
     WHERE user_id = ? AND resource_id = ? AND status = 'WAITING'
       AND start_time < ? AND end_time > ?`,
    [userId, resourceId, endTime, startTime]
  );

  if (existing.length > 0) {
    throw Object.assign(new Error('You are already on the waitlist for this time slot.'), {
      statusCode: 409,
    });
  }

  const [result] = await pool.execute(
    `INSERT INTO waitlist (user_id, resource_id, start_time, end_time, purpose, status)
     VALUES (?, ?, ?, ?, ?, 'WAITING')`,
    [userId, resourceId, startTime, endTime, purpose || 'Academic / Study Session']
  );

  const [positionRows] = await pool.execute(
    `SELECT COUNT(*) AS position FROM waitlist
     WHERE resource_id = ? AND status = 'WAITING'
       AND start_time < ? AND end_time > ? AND id <= ?`,
    [resourceId, endTime, startTime, result.insertId]
  );

  const queuePosition = positionRows[0]?.position || 1;

  await logAudit(userId, 'WAITLIST_JOINED', 'WAITLIST', result.insertId, {
    resourceId,
    startTime,
    endTime,
    queuePosition,
  });

  emitLiveUpdate('WAITLIST_UPDATED', {
    resourceId: Number(resourceId),
    waitlistId: result.insertId,
    queuePosition,
    message: `New user joined waitlist (Position #${queuePosition}) for Resource #${resourceId}.`,
  });

  return {
    id: result.insertId,
    resource_id: Number(resourceId),
    start_time: startTime,
    end_time: endTime,
    queue_position: queuePosition,
    status: 'WAITING',
  };
};

/**
 * Promote the oldest eligible WAITING user when a booking is cancelled or auto-released
 */
const promoteNextInWaitlist = async ({ resourceId, startTime, endTime }) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [resources] = await connection.execute(
      'SELECT id, name, status FROM resources WHERE id = ? FOR UPDATE',
      [resourceId]
    );

    if (resources.length === 0 || resources[0].status === 'MAINTENANCE') {
      await connection.rollback();
      return null;
    }

    const resource = resources[0];

    const [candidates] = await connection.execute(
      `SELECT w.*, u.name AS user_name, u.email AS user_email
       FROM waitlist w
       JOIN users u ON w.user_id = u.id
       WHERE w.resource_id = ?
         AND w.status = 'WAITING'
         AND w.start_time < ?
         AND w.end_time > ?
         AND w.end_time > NOW()
       ORDER BY w.created_at ASC, w.id ASC
       LIMIT 1
       FOR UPDATE`,
      [resourceId, endTime, startTime]
    );

    if (candidates.length === 0) {
      await connection.commit();
      return null;
    }

    const nextPerson = candidates[0];

    const [conflicts] = await connection.execute(
      `SELECT id FROM bookings
       WHERE resource_id = ?
         AND status IN ('CONFIRMED', 'CHECKED_IN')
         AND start_time < ?
         AND end_time > ?
       FOR UPDATE`,
      [resourceId, nextPerson.end_time, nextPerson.start_time]
    );

    if (conflicts.length > 0) {
      await connection.commit();
      return null;
    }

    const qrToken = `SLOT-${crypto.randomBytes(8).toString('hex').toUpperCase()}`;

    const [bookingInsert] = await connection.execute(
      `INSERT INTO bookings (user_id, resource_id, start_time, end_time, purpose, status, qr_token)
       VALUES (?, ?, ?, ?, ?, 'CONFIRMED', ?)`,
      [
        nextPerson.user_id,
        resourceId,
        nextPerson.start_time,
        nextPerson.end_time,
        nextPerson.purpose || 'Auto-Promoted Waitlist Session',
        qrToken,
      ]
    );

    const promotedBookingId = bookingInsert.insertId;

    await connection.execute(
      `UPDATE waitlist
       SET status = 'PROMOTED', promoted_booking_id = ?
       WHERE id = ?`,
      [promotedBookingId, nextPerson.id]
    );

    await connection.commit();

    await logAudit(nextPerson.user_id, 'WAITLIST_AUTO_PROMOTED', 'BOOKING', promotedBookingId, {
      waitlistId: nextPerson.id,
      resourceId,
    });

    emitLiveUpdate('WAITLIST_PROMOTED', {
      resourceId: Number(resourceId),
      resourceName: resource.name,
      promotedUserId: nextPerson.user_id,
      promotedUserName: nextPerson.user_name,
      bookingId: promotedBookingId,
      status: 'RESERVED',
      message: `⚡ Auto-Promoted ${nextPerson.user_name} from waitlist into ${resource.name}!`,
    });

    return {
      waitlistId: nextPerson.id,
      bookingId: promotedBookingId,
      userId: nextPerson.user_id,
      userName: nextPerson.user_name,
      resourceName: resource.name,
      qrToken,
    };
  } catch (err) {
    await connection.rollback();
    console.error('❌ Waitlist Auto-Promotion Error:', err.message);
    return null;
  } finally {
    connection.release();
  }
};

/**
 * Fetch all waitlist entries for the logged-in user along with their live queue position
 */
const getUserWaitlist = async (userId) => {
  const [rows] = await pool.execute(
    `SELECT w.*, r.name AS resource_name, r.category, r.location,
            (
              SELECT COUNT(*) FROM waitlist w2
              WHERE w2.resource_id = w.resource_id
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

/**
 * Remove the user from an active waitlist entry
 */
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