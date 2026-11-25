const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');
const { protect } = require('../middleware/authMiddleware');
const { createBookingWithLock } = require('../services/bookingService');
const { promoteNextInWaitlist } = require('../services/waitlistService');
const { getUserReliabilityProfile } = require('../services/reliabilityService');
const { buildBookingIcs } = require('../utils/icsGenerator');
const { emitLiveUpdate } = require('../utils/socketManager');

// GET /api/bookings/reliability
router.get('/reliability', protect, async (req, res, next) => {
  try {
    const profile = await getUserReliabilityProfile(req.user.id);
    res.json({ success: true, reliability: profile });
  } catch (err) {
    next(err);
  }
});

// GET /api/bookings/my & /api/bookings/my-bookings - Includes both user's own bookings & group study invites
router.get(['/my', '/my-bookings'], protect, async (req, res, next) => {
  try {
    const [bookings] = await pool.execute(
      `SELECT DISTINCT
              b.*,
              r.resource_code,
              r.resource_name,
              r.resource_type,
              r.building,
              r.floor_number,
              r.room_number,
              CASE WHEN b.user_id = ? THEN 'ORGANIZER' ELSE 'INVITED_GUEST' END AS participation_role,
              (
                SELECT GROUP_CONCAT(bp2.invitee_email SEPARATOR ', ')
                FROM booking_participants bp2
                WHERE bp2.booking_id = b.id
              ) AS invited_emails
       FROM bookings b
       JOIN resources r ON b.resource_id = r.id
       LEFT JOIN booking_participants bp ON bp.booking_id = b.id
       WHERE b.user_id = ? OR bp.user_id = ? OR LOWER(bp.invitee_email) = LOWER(?)
       ORDER BY b.booking_date DESC, b.start_time DESC`,
      [req.user.id, req.user.id, req.user.id, req.user.email || '']
    );
    res.json({ success: true, count: bookings.length, bookings });
  } catch (err) {
    next(err);
  }
});

// GET /api/bookings/:id/ics - One-Click Calendar (.ics) Download
router.get('/:id/ics', protect, async (req, res, next) => {
  try {
    const [rows] = await pool.execute(
      `SELECT b.*, r.resource_code, r.resource_name, r.building, r.floor_number, r.room_number
       FROM bookings b
       JOIN resources r ON b.resource_id = r.id
       WHERE b.id = ?`,
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    const booking = rows[0];
    const icsContent = buildBookingIcs(booking);

    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="SlotSync-${booking.booking_code}.ics"`
    );
    res.send(icsContent);
  } catch (err) {
    next(err);
  }
});

// POST /api/bookings
router.post('/', protect, async (req, res, next) => {
  try {
    const { resource_id, booking_date, start_time, end_time, invitees } = req.body;

    if (!resource_id || !booking_date || !start_time || !end_time) {
      return res.status(400).json({
        success: false,
        message: 'resource_id, booking_date, start_time, and end_time are required.',
      });
    }

    if (end_time <= start_time) {
      return res.status(400).json({
        success: false,
        message: 'End time must be after start time.',
      });
    }

    const booking = await createBookingWithLock({
      userId: req.user.id,
      resourceId: resource_id,
      bookingDate: booking_date,
      startTime: start_time,
      endTime: end_time,
      invitees: invitees || [],
    });

    res.status(201).json({
      success: true,
      message: 'Resource reserved successfully!',
      booking,
    });
  } catch (err) {
    if (err.statusCode === 409) {
      return res.status(409).json({
        success: false,
        canWaitlist: true,
        message: err.message,
      });
    }
    next(err);
  }
});

// Shared handler for PUT and PATCH /api/bookings/:id/cancel
const cancelBookingHandler = async (req, res, next) => {
  try {
    const bookingId = req.params.id;
    const [rows] = await pool.execute('SELECT * FROM bookings WHERE id = ?', [bookingId]);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    const booking = rows[0];
    if (booking.user_id !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Not authorized to cancel this booking.' });
    }

    if (!['PENDING', 'CONFIRMED', 'CHECKED_IN'].includes(booking.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel a booking with status ${booking.status}.`,
      });
    }

    await pool.execute(
      `UPDATE bookings SET status = 'CANCELLED', updated_at = NOW() WHERE id = ?`,
      [bookingId]
    );

    await pool.execute(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id)
       VALUES (?, 'BOOKING_CANCELLED', 'BOOKING', ?)`,
      [req.user.id, bookingId]
    );

    const promoted = await promoteNextInWaitlist({
      resourceId: booking.resource_id,
      bookingDate: booking.booking_date,
      startTime: booking.start_time,
      endTime: booking.end_time,
    });

    if (!promoted) {
      emitLiveUpdate('BOOKING_CANCELLED', {
        resourceId: booking.resource_id,
        bookingId: booking.id,
        status: 'AVAILABLE',
        message: `Slot on Resource #${booking.resource_id} was cancelled and is now open.`,
      });
    }

    res.json({
      success: true,
      message: promoted
        ? `Booking cancelled and ${promoted.userName} was auto-promoted from the waitlist!`
        : 'Booking cancelled successfully.',
      promoted,
    });
  } catch (err) {
    next(err);
  }
};

router.put('/:id/cancel', protect, cancelBookingHandler);
router.patch('/:id/cancel', protect, cancelBookingHandler);

module.exports = router;