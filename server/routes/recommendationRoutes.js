const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { getSmartRecommendations } = require('../services/recommendationService');

// GET /api/recommendations?resourceId=1&date=2026-11-24
router.get('/', protect, async (req, res, next) => {
  try {
    const { resourceId, date } = req.query;
    const data = await getSmartRecommendations({ resourceId, targetDate: date });
    res.json({ success: true, ...data });
  } catch (err) {
    next(err);
  }
});

module.exports = router;