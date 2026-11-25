const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  joinWaitlist,
  getUserWaitlist,
  leaveWaitlist,
} = require('../services/waitlistService');

router.get('/my', protect, async (req, res, next) => {
  try {
    const entries = await getUserWaitlist(req.user.id);
    res.json({ success: true, count: entries.length, waitlist: entries });
  } catch (err) {
    next(err);
  }
});

router.post('/', protect, async (req, res, next) => {
  try {
    const { resource_id, booking_date, start_time, end_time } = req.body;

    if (!resource_id || !booking_date || !start_time || !end_time) {
      return res.status(400).json({
        success: false,
        message: 'resource_id, booking_date, start_time, and end_time are required.',
      });
    }

    const entry = await joinWaitlist({
      userId: req.user.id,
      resourceId: resource_id,
      bookingDate: booking_date,
      startTime: start_time,
      endTime: end_time,
    });

    res.status(201).json({
      success: true,
      message: `Added to waitlist at Position #${entry.queue_position}. You will be auto-promoted if the slot opens!`,
      entry,
    });
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', protect, async (req, res, next) => {
  try {
    await leaveWaitlist(req.params.id, req.user.id);
    res.json({ success: true, message: 'Removed from waitlist.' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;