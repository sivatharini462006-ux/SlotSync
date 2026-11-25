const { ApiError } = require('../middleware/errorHandler');
const {
  createBookingWithLock,
  cancelBookingWithLock,
} = require('../services/bookingService');
const {
  getBookingsByUserId,
  getAllBookings,
  getBookingById,
} = require('../models/bookingModel');

/**
 * Normalize time strings like "10:00" into "10:00:00"
 */
const normalizeTime = (timeStr) => {
  if (!timeStr || typeof timeStr !== 'string') return null;
  const trimmed = timeStr.trim();
  if (/^\d{2}:\d{2}$/.test(trimmed)) return `${trimmed}:00`;
  if (/^\d{2}:\d{2}:\d{2}$/.test(trimmed)) return trimmed;
  return null;
};

/**
 * @desc    Create a new booking (Concurrency-Safe with Row-Level Locking)
 * @route   POST /api/bookings
 * @access  Private (STUDENT, FACULTY, ADMIN)
 */
const createBooking = async (req, res, next) => {
  try {
    const { resource_id, booking_date, start_time, end_time } = req.body;

    if (!resource_id || !booking_date || !start_time || !end_time) {
      throw new ApiError(
        400,
        'resource_id, booking_date, start_time, and end_time are required.'
      );
    }

    // 1. Validate date format (YYYY-MM-DD)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(booking_date)) {
      throw new ApiError(400, 'Invalid booking_date format. Expected YYYY-MM-DD.');
    }

    // 2. Validate and normalize times
    const normStart = normalizeTime(start_time);
    const normEnd = normalizeTime(end_time);

    if (!normStart || !normEnd) {
      throw new ApiError(400, 'Invalid time format. Expected HH:MM or HH:MM:SS.');
    }

    // 3. Validate start_time < end_time
    if (normStart >= normEnd) {
      throw new ApiError(400, 'End time must be strictly after start time.');
    }

    // 4. Prevent past-date or past-time bookings (using local server date/time)
    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const todayStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
    const currentTimeStr = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

    if (booking_date < todayStr) {
      throw new ApiError(400, 'Cannot create a reservation for a past date.');
    }

    if (booking_date === todayStr && normEnd <= currentTimeStr) {
      throw new ApiError(400, 'Cannot create a reservation for a time slot that has already ended.');
    }

    // 5. Execute concurrency-safe transaction
    const booking = await createBookingWithLock({
      userId: req.user.id,
      resourceId: Number(resource_id),
      bookingDate: booking_date,
      startTime: normStart,
      endTime: normEnd,
    });

    res.status(201).json({
      success: true,
      message: 'Reservation confirmed successfully.',
      booking,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all bookings (ADMIN gets all; STUDENT/FACULTY get their own)
 * @route   GET /api/bookings
 * @access  Private
 */
const listBookings = async (req, res, next) => {
  try {
    const { status, date, resource_id } = req.query;

    if (req.user.role === 'ADMIN') {
      const bookings = await getAllBookings({
        status,
        date,
        resourceId: resource_id,
      });
      return res.status(200).json({
        success: true,
        count: bookings.length,
        bookings,
      });
    }

    const bookings = await getBookingsByUserId(req.user.id, { status });
    res.status(200).json({
      success: true,
      count: bookings.length,
      bookings,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get logged-in user's bookings (supports ?timeframe=upcoming|history)
 * @route   GET /api/bookings/my-bookings
 * @access  Private
 */
const getMyBookings = async (req, res, next) => {
  try {
    const { status, timeframe } = req.query;
    const bookings = await getBookingsByUserId(req.user.id, { status, timeframe });

    res.status(200).json({
      success: true,
      count: bookings.length,
      bookings,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single booking details
 * @route   GET /api/bookings/:id
 * @access  Private (Owner or ADMIN)
 */
const getSingleBooking = async (req, res, next) => {
  try {
    const booking = await getBookingById(req.params.id);
    if (!booking) {
      throw new ApiError(404, 'Booking not found.');
    }

    if (req.user.role !== 'ADMIN' && booking.user_id !== req.user.id) {
      throw new ApiError(403, 'Not authorized to view this reservation.');
    }

    // Never expose checkin_token_hash to the client
    const { checkin_token_hash, ...safeBooking } = booking;

    res.status(200).json({
      success: true,
      booking: safeBooking,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Cancel an eligible booking
 * @route   PUT /api/bookings/:id/cancel
 * @access  Private (Owner or ADMIN)
 */
const cancelBooking = async (req, res, next) => {
  try {
    const cancelled = await cancelBookingWithLock({
      bookingId: Number(req.params.id),
      userId: req.user.id,
      userRole: req.user.role,
    });

    res.status(200).json({
      success: true,
      message: 'Reservation cancelled and slot released.',
      booking: cancelled,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createBooking,
  listBookings,
  getMyBookings,
  getSingleBooking,
  cancelBooking,
};