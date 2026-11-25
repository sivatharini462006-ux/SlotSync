const crypto = require('crypto');
const QRCode = require('qrcode');
const { pool } = require('../config/db');
const { ApiError } = require('../middleware/errorHandler');
const { logAudit } = require('../utils/auditLogger');

/**
 * @desc    Verify QR token or manual booking code and mark reservation as CHECKED_IN
 * @route   POST /api/checkin
 * @access  Private (Authenticated user or Admin)
 */
const checkInBooking = async (req, res, next) => {
  let connection;
  try {
    const { bookingCode, token, method = 'QR_SCAN' } = req.body;

    if (!bookingCode) {
      throw new ApiError(400, 'Booking code is required for check-in.');
    }

    const normalizedCode = bookingCode.toUpperCase().trim();
    const checkInMethod = method === 'MANUAL_CODE' ? 'MANUAL_CODE' : 'QR_SCAN';

    if (checkInMethod === 'QR_SCAN' && !token) {
      throw new ApiError(400, 'Check-in security token is required for QR verification.');
    }

    connection = await pool.getConnection();
    await connection.beginTransaction();

    // Lock booking row during check-in to prevent race conditions with cron no-show release
    const [rows] = await connection.execute(
      `SELECT
         b.*,
         r.resource_code,
         r.resource_name,
         r.building,
         r.floor_number,
         r.room_number,
         u.name AS user_name
       FROM bookings b
       INNER JOIN resources r ON b.resource_id = r.id
       INNER JOIN users u ON b.user_id = u.id
       WHERE b.booking_code = ?
       FOR UPDATE`,
      [normalizedCode]
    );

    if (rows.length === 0) {
      throw new ApiError(404, `No reservation found with booking code '${normalizedCode}'.`);
    }

    const booking = rows[0];

    // Authorization: owner or ADMIN can perform check-in
    if (req.user.role !== 'ADMIN' && booking.user_id !== req.user.id) {
      throw new ApiError(403, 'You are not authorized to check in to this reservation.');
    }

    // Validate status
    if (booking.status === 'CHECKED_IN') {
      throw new ApiError(400, 'This reservation has already been checked in.');
    }

    if (['CANCELLED', 'NO_SHOW', 'COMPLETED'].includes(booking.status)) {
      throw new ApiError(
        400,
        `Cannot check in: reservation status is '${booking.status}'.`
      );
    }

    // Validate cryptographic token hash when QR_SCAN is used
    if (checkInMethod === 'QR_SCAN') {
      const providedHash = crypto.createHash('sha256').update(token.trim()).digest('hex');
      if (providedHash !== booking.checkin_token_hash) {
        throw new ApiError(401, 'Invalid or tampered QR check-in token.');
      }
    }

    // Validate reservation date & time window (allow check-in from 15 mins before start until end_time)
    const now = new Date();
    const startDateTime = new Date(`${booking.booking_date}T${booking.start_time}`);
    const endDateTime = new Date(`${booking.booking_date}T${booking.end_time}`);
    const earliestCheckIn = new Date(startDateTime.getTime() - 15 * 60 * 1000);

    if (now < earliestCheckIn) {
      throw new ApiError(
        400,
        `Too early to check in. Check-in opens 15 minutes before ${booking.start_time.slice(0, 5)} on ${booking.booking_date}.`
      );
    }

    if (now > endDateTime) {
      throw new ApiError(400, 'This reservation time slot has already expired.');
    }

    // Update booking status to CHECKED_IN
    await connection.execute(
      `UPDATE bookings
       SET status = 'CHECKED_IN',
           check_in_time = NOW()
       WHERE id = ?`,
      [booking.id]
    );

    // Record check-in entry
    await connection.execute(
      `INSERT INTO check_ins (booking_id, check_in_method)
       VALUES (?, ?)`,
      [booking.id, checkInMethod]
    );

    await logAudit(
      {
        userId: req.user.id,
        action: `BOOKING_CHECKED_IN_${normalizedCode}`,
        entityType: 'BOOKING',
        entityId: booking.id,
      },
      connection
    );

    await connection.commit();

    res.status(200).json({
      success: true,
      message: 'Check-in verified successfully!',
      booking: {
        id: booking.id,
        booking_code: booking.booking_code,
        booking_date: booking.booking_date,
        start_time: booking.start_time,
        end_time: booking.end_time,
        status: 'CHECKED_IN',
        resource_code: booking.resource_code,
        resource_name: booking.resource_name,
        building: booking.building,
        floor_number: booking.floor_number,
        room_number: booking.room_number,
      },
    });
  } catch (error) {
    if (connection) {
      try {
        await connection.rollback();
      } catch (e) {
        console.error('Check-in rollback error:', e.message);
      }
    }
    next(error);
  } finally {
    if (connection) connection.release();
  }
};

/**
 * @desc    Retrieve booking details & regenerate QR code by bookingCode
 * @route   GET /api/checkin/:bookingCode
 * @access  Private
 */
const getBookingByCode = async (req, res, next) => {
  try {
    const normalizedCode = req.params.bookingCode.toUpperCase().trim();

    const [rows] = await pool.execute(
      `SELECT
         b.id,
         b.user_id,
         b.resource_id,
         b.booking_date,
         b.start_time,
         b.end_time,
         b.booking_code,
         b.status,
         b.check_in_time,
         r.resource_code,
         r.resource_name,
         r.resource_type,
         r.building,
         r.floor_number,
         r.room_number,
         u.name AS user_name,
         u.email AS user_email
       FROM bookings b
       INNER JOIN resources r ON b.resource_id = r.id
       INNER JOIN users u ON b.user_id = u.id
       WHERE b.booking_code = ?
       LIMIT 1`,
      [normalizedCode]
    );

    if (rows.length === 0) {
      throw new ApiError(404, 'Booking not found.');
    }

    const booking = rows[0];
    if (req.user.role !== 'ADMIN' && booking.user_id !== req.user.id) {
      throw new ApiError(403, 'Not authorized to access this booking.');
    }

    // Generate QR image encoding the booking code for display/reprint
    const qrCodeUrl = await QRCode.toDataURL(
      JSON.stringify({ bookingCode: booking.booking_code }),
      { width: 260, margin: 2, color: { dark: '#0A192F', light: '#FFFFFF' } }
    );

    res.status(200).json({
      success: true,
      booking,
      qr_code_url: qrCodeUrl,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  checkInBooking,
  getBookingByCode,
};