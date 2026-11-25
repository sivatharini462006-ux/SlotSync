const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { checkInBooking, getBookingByCode } = require('../controllers/checkinController');

const router = express.Router();

// Normalize snake_case or camelCase fields before controller runs
const normalizeCheckInPayload = (req, res, next) => {
  if (!req.body.bookingCode && req.body.booking_code) {
    req.body.bookingCode = req.body.booking_code;
  }
  if (!req.body.token && req.body.qr_token) {
    req.body.token = req.body.qr_token;
  }
  if (!req.body.token && req.body.checkin_token) {
    req.body.token = req.body.checkin_token;
  }
  next();
};

router.post('/', protect, normalizeCheckInPayload, checkInBooking);
router.get('/:bookingCode', protect, getBookingByCode);

module.exports = router;