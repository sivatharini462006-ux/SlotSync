const crypto = require('crypto');
const { pool } = require('../config/db');
const { emitLiveUpdate } = require('../utils/socketManager');
const { promoteNextInWaitlist } = require('./waitlistService');
const { enforceFairnessRules, adjustReliabilityScore } = require('./reliabilityService');

const generateBookingCode = () =>
  `SS-${new Date().getFullYear()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

const generateCheckinHash = (code) =>
  crypto.createHash('sha256').update(`${code}-${process.env.JWT_SECRET || 'slotsync'}`).digest('hex');

const createBookingWithLock = async ({
  userId,
  resourceId,
  bookingDate,
  startTime,
  endTime,
  invitees = [],
}) => {
  await enforceFairnessRules({ userId, bookingDate });

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // 1. Lock the resource row in InnoDB
    const [resources] = await connection.execute(
      'SELECT id, resource_code, resource_name, status, capacity FROM resources WHERE id = ? FOR UPDATE',
      [resourceId]
    );

    if (resources.length === 0) {
      throw Object.assign(new Error('Resource not found.'), { statusCode: 404 });
    }

    const resource = resources[0];
    if (resource.status !== 'ACTIVE') {
      throw Object.assign(new Error(`Resource is currently ${resource.status}.`), { statusCode: 400 });
    }

    // Validate group size against resource capacity
    const cleanEmails = [
      ...new Set(
        (Array.isArray(invitees) ? invitees : [])
          .map((e) => String(e).trim().toLowerCase())
          .filter((e) => e.includes('@'))
      ),
    ];

    if (cleanEmails.length + 1 > Number(resource.capacity)) {
      throw Object.assign(
        new Error(
          `Capacity exceeded: ${resource.resource_name} supports up to ${resource.capacity} participant(s) including you.`
        ),
        { statusCode: 400 }
      );
    }

    // 2. Check overlapping bookings on that date under row lock
    const [conflicts] = await connection.execute(
      `SELECT id FROM bookings
       WHERE resource_id = ?
         AND booking_date = ?
         AND status IN ('PENDING', 'CONFIRMED', 'CHECKED_IN')
         AND start_time < ?
         AND end_time > ?
       FOR UPDATE`,
      [resourceId, bookingDate, endTime, startTime]
    );

    if (conflicts.length > 0) {
      throw Object.assign(
        new Error('Slot conflict: This resource is already reserved during the selected time window.'),
        { statusCode: 409, canWaitlist: true }
      );
    }

    const bookingCode = generateBookingCode();
    const checkinTokenHash = generateCheckinHash(bookingCode);

    const [insertResult] = await connection.execute(
      `INSERT INTO bookings (user_id, resource_id, booking_date, start_time, end_time, booking_code, checkin_token_hash, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'CONFIRMED')`,
      [userId, resourceId, bookingDate, startTime, endTime, bookingCode, checkinTokenHash]
    );

    const bookingId = insertResult.insertId;

    // 3. Insert invited group participants (linking registered SlotSync users if found)
    const invitedList = [];
    for (const email of cleanEmails) {
      const [matchedUsers] = await connection.execute(
        'SELECT id, name, email FROM users WHERE LOWER(email) = ?',
        [email]
      );
      const matchedUser = matchedUsers[0] || null;
      if (matchedUser && matchedUser.id === userId) continue;

      await connection.execute(
        `INSERT INTO booking_participants (booking_id, user_id, invitee_email, invite_status)
         VALUES (?, ?, ?, 'INVITED')`,
        [bookingId, matchedUser ? matchedUser.id : null, email]
      );

      invitedList.push({
        email,
        name: matchedUser ? matchedUser.name : email,
        registered: Boolean(matchedUser),
      });
    }

    await connection.execute(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id)
       VALUES (?, 'BOOKING_CREATED', 'BOOKING', ?)`,
      [userId, bookingId]
    );

    await connection.commit();

    emitLiveUpdate('BOOKING_CREATED', {
      resourceId: Number(resourceId),
      resourceName: resource.resource_name,
      bookingId,
      status: 'RESERVED',
      message: `${resource.resource_name} was just reserved.`,
    });

    return {
      id: bookingId,
      user_id: userId,
      resource_id: Number(resourceId),
      resource_code: resource.resource_code,
      resource_name: resource.resource_name,
      booking_date: bookingDate,
      start_time: startTime,
      end_time: endTime,
      booking_code: bookingCode,
      status: 'CONFIRMED',
      participants: invitedList,
    };
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
};

const releaseExpiredNoShows = async () => {
  const [expired] = await pool.execute(
    `SELECT b.id, b.user_id, b.resource_id, b.booking_date, b.start_time, b.end_time, r.resource_name
     FROM bookings b
     JOIN resources r ON b.resource_id = r.id
     WHERE b.status = 'CONFIRMED'
       AND b.check_in_time IS NULL
       AND TIMESTAMP(b.booking_date, b.start_time) <= DATE_SUB(NOW(), INTERVAL 15 MINUTE)`
  );

  if (expired.length === 0) return 0;

  const ids = expired.map((b) => b.id);
  const placeholders = ids.map(() => '?').join(',');

  const [result] = await pool.execute(
    `UPDATE bookings
     SET status = 'NO_SHOW', released_at = NOW(), updated_at = NOW()
     WHERE id IN (${placeholders})`,
    ids
  );

  if (result.affectedRows > 0) {
    console.log(`⏱️ Auto-released ${result.affectedRows} expired no-show booking(s).`);

    for (const item of expired) {
      await pool.execute(
        `INSERT INTO audit_logs (user_id, action, entity_type, entity_id)
         VALUES (?, 'NO_SHOW_AUTO_RELEASED', 'BOOKING', ?)`,
        [item.user_id, item.id]
      );

      await adjustReliabilityScore(item.user_id, -15, 'NO_SHOW_PENALTY');

      await promoteNextInWaitlist({
        resourceId: item.resource_id,
        bookingDate: item.booking_date,
        startTime: item.start_time,
        endTime: item.end_time,
      });
    }

    emitLiveUpdate('NO_SHOW_RELEASED', {
      releasedCount: result.affectedRows,
      status: 'AVAILABLE',
      message: `${result.affectedRows} unverified slot(s) auto-released!`,
    });
  }

  return result.affectedRows;
};

module.exports = {
  createBookingWithLock,
  releaseExpiredNoShows,
};