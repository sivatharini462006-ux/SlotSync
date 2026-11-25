const express = require('express');
const {
  getAdminDashboard,
  getAllUsers,
  updateUserAccount,
  getAdminBookings,
  getNoShows,
  getAnalytics,
  getResourceUsage,
  getAuditLogs,
} = require('../controllers/adminController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

const router = express.Router();

// Strictly protect all admin routes
router.use(protect, authorizeRoles('ADMIN'));

router.get('/dashboard', getAdminDashboard);
router.get('/users', getAllUsers);
router.put('/users/:id', updateUserAccount);
router.get('/bookings', getAdminBookings);
router.get('/no-shows', getNoShows);
router.get('/analytics', getAnalytics);
router.get('/resource-usage', getResourceUsage);
router.get('/audit-logs', getAuditLogs);

module.exports = router;