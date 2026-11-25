const { pool } = require('../config/db');
const { ApiError } = require('../middleware/errorHandler');
const { getAllBookings } = require('../models/bookingModel');
const { logAudit } = require('../utils/auditLogger');

/**
 * @desc    Admin KPI Dashboard Summary
 * @route   GET /api/admin/dashboard
 * @access  Private (ADMIN)
 */
const getAdminDashboard = async (req, res, next) => {
  try {
    const [[userStats]] = await pool.query(`SELECT COUNT(*) AS totalUsers FROM users`);
    const [[resourceStats]] = await pool.query(`
      SELECT
        COUNT(*) AS totalResources,
        SUM(CASE WHEN status = 'ACTIVE' THEN 1 ELSE 0 END) AS activeResources
      FROM resources
    `);

    const [[bookingStats]] = await pool.query(`
      SELECT
        SUM(CASE WHEN status IN ('PENDING', 'CONFIRMED', 'CHECKED_IN') THEN 1 ELSE 0 END) AS activeReservations,
        SUM(CASE WHEN status = 'COMPLETED' THEN 1 ELSE 0 END) AS completedReservations,
        SUM(CASE WHEN status = 'CANCELLED' THEN 1 ELSE 0 END) AS cancelledReservations,
        SUM(CASE WHEN status = 'NO_SHOW' THEN 1 ELSE 0 END) AS noShowReservations,
        SUM(CASE WHEN booking_date = CURDATE() THEN 1 ELSE 0 END) AS bookingsToday
      FROM bookings
    `);

    const [recentBookings] = await pool.query(`
      SELECT
        b.id, b.booking_code, b.booking_date, b.start_time, b.end_time, b.status,
        u.name AS user_name, u.role AS user_role,
        r.resource_code, r.resource_name, r.resource_type
      FROM bookings b
      INNER JOIN users u ON b.user_id = u.id
      INNER JOIN resources r ON b.resource_id = r.id
      ORDER BY b.created_at DESC
      LIMIT 8
    `);

    res.status(200).json({
      success: true,
      stats: {
        totalUsers: Number(userStats.totalUsers || 0),
        totalResources: Number(resourceStats.totalResources || 0),
        availableResources: Number(resourceStats.activeResources || 0),
        activeReservations: Number(bookingStats.activeReservations || 0),
        completedReservations: Number(bookingStats.completedReservations || 0),
        cancelledReservations: Number(bookingStats.cancelledReservations || 0),
        noShowReservations: Number(bookingStats.noShowReservations || 0),
        bookingsToday: Number(bookingStats.bookingsToday || 0),
      },
      recentBookings,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all registered users
 * @route   GET /api/admin/users
 * @access  Private (ADMIN)
 */
const getAllUsers = async (req, res, next) => {
  try {
    const [users] = await pool.query(`
      SELECT
        u.id, u.name, u.email, u.role, u.status, u.created_at,
        COUNT(b.id) AS total_bookings
      FROM users u
      LEFT JOIN bookings b ON u.id = b.user_id
      GROUP BY u.id
      ORDER BY u.created_at DESC
    `);

    res.status(200).json({
      success: true,
      count: users.length,
      users,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Toggle user status (ACTIVE / SUSPENDED) or role
 * @route   PUT /api/admin/users/:id
 * @access  Private (ADMIN)
 */
const updateUserAccount = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, role } = req.body;

    if (Number(id) === req.user.id && status === 'SUSPENDED') {
      throw new ApiError(400, 'You cannot suspend your own administrator account.');
    }

    const [rows] = await pool.execute(`SELECT * FROM users WHERE id = ?`, [id]);
    if (rows.length === 0) {
      throw new ApiError(404, 'User not found.');
    }

    const nextStatus = status ? status.toUpperCase() : rows[0].status;
    const nextRole = role ? role.toUpperCase() : rows[0].role;

    await pool.execute(
      `UPDATE users SET status = ?, role = ? WHERE id = ?`,
      [nextStatus, nextRole, id]
    );

    await logAudit({
      userId: req.user.id,
      action: `USER_UPDATED_${rows[0].email}_${nextStatus}`,
      entityType: 'USER',
      entityId: Number(id),
    });

    res.status(200).json({
      success: true,
      message: 'User account updated successfully.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all reservations for Admin management
 * @route   GET /api/admin/bookings
 * @access  Private (ADMIN)
 */
const getAdminBookings = async (req, res, next) => {
  try {
    const { status, date, resource_id } = req.query;
    const bookings = await getAllBookings({ status, date, resourceId: resource_id });
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
 * @desc    Get all NO_SHOW bookings
 * @route   GET /api/admin/no-shows
 * @access  Private (ADMIN)
 */
const getNoShows = async (req, res, next) => {
  try {
    const bookings = await getAllBookings({ status: 'NO_SHOW' });
    res.status(200).json({
      success: true,
      count: bookings.length,
      noShows: bookings,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Comprehensive Chart.js Analytics Data (with optional date & category filters)
 * @route   GET /api/admin/analytics
 * @access  Private (ADMIN)
 */
const getAnalytics = async (req, res, next) => {
  try {
    const { category, start_date, end_date } = req.query;

    const filterClauses = ['1 = 1'];
    const filterParams = [];

    if (category) {
      filterClauses.push('r.resource_type = ?');
      filterParams.push(category.toUpperCase());
    }
    if (start_date) {
      filterClauses.push('b.booking_date >= ?');
      filterParams.push(start_date);
    }
    if (end_date) {
      filterClauses.push('b.booking_date <= ?');
      filterParams.push(end_date);
    }

    const whereSql = filterClauses.join(' AND ');

    // 1. Daily Bookings (last 7 days or filtered range)
    const [dailyBookings] = await pool.execute(
      `SELECT b.booking_date AS date, COUNT(*) AS count
       FROM bookings b
       INNER JOIN resources r ON b.resource_id = r.id
       WHERE ${whereSql}
       GROUP BY b.booking_date
       ORDER BY b.booking_date ASC
       LIMIT 14`,
      filterParams
    );

    // 2. Weekly Bookings (by ISO year-week)
    const [weeklyBookings] = await pool.execute(
      `SELECT YEARWEEK(b.booking_date, 1) AS year_week,
              MIN(b.booking_date) AS week_start,
              COUNT(*) AS count
       FROM bookings b
       INNER JOIN resources r ON b.resource_id = r.id
       WHERE ${whereSql}
       GROUP BY YEARWEEK(b.booking_date, 1)
       ORDER BY year_week ASC
       LIMIT 8`,
      filterParams
    );

    // 3. Bookings by Resource Category
    const [categoryDistribution] = await pool.execute(
      `SELECT r.resource_type AS category, COUNT(b.id) AS count
       FROM resources r
       LEFT JOIN bookings b ON r.id = b.resource_id
       GROUP BY r.resource_type`
    );

    // 4. Booking Status Distribution
    const [statusDistribution] = await pool.execute(
      `SELECT b.status, COUNT(*) AS count
       FROM bookings b
       INNER JOIN resources r ON b.resource_id = r.id
       WHERE ${whereSql}
       GROUP BY b.status`,
      filterParams
    );

    // 5. Most Frequently Booked Resources (Top 6)
    const [topResources] = await pool.execute(
      `SELECT r.resource_code, r.resource_name, r.resource_type, COUNT(b.id) AS booking_count
       FROM resources r
       LEFT JOIN bookings b ON r.id = b.resource_id
       GROUP BY r.id
       ORDER BY booking_count DESC, r.resource_code ASC
       LIMIT 6`
    );

    // 6. Overall Resource Utilization %
    const [[utilRow]] = await pool.query(`
      SELECT
        COUNT(DISTINCT r.id) AS total_active_resources,
        COUNT(DISTINCT CASE WHEN b.status IN ('CONFIRMED', 'CHECKED_IN', 'COMPLETED') THEN b.resource_id END) AS utilized_resources
      FROM resources r
      LEFT JOIN bookings b ON r.id = b.resource_id
      WHERE r.status = 'ACTIVE'
    `);

    const utilizationPercentage =
      utilRow.total_active_resources > 0
        ? Math.round((utilRow.utilized_resources / utilRow.total_active_resources) * 100)
        : 0;

    res.status(200).json({
      success: true,
      utilizationPercentage,
      dailyBookings,
      weeklyBookings,
      categoryDistribution,
      statusDistribution,
      topResources,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Resource Utilization Breakdown per Resource
 * @route   GET /api/admin/resource-usage
 * @access  Private (ADMIN)
 */
const getResourceUsage = async (req, res, next) => {
  try {
    const [usage] = await pool.query(`
      SELECT
        r.id,
        r.resource_code,
        r.resource_name,
        r.resource_type,
        r.building,
        r.floor_number,
        r.status,
        COUNT(b.id) AS total_bookings,
        SUM(CASE WHEN b.status = 'CHECKED_IN' OR b.status = 'COMPLETED' THEN 1 ELSE 0 END) AS completed_bookings,
        SUM(CASE WHEN b.status = 'NO_SHOW' THEN 1 ELSE 0 END) AS no_show_count
      FROM resources r
      LEFT JOIN bookings b ON r.id = b.resource_id
      GROUP BY r.id
      ORDER BY total_bookings DESC, r.resource_code ASC
    `);

    res.status(200).json({
      success: true,
      usage,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get System Audit Logs
 * @route   GET /api/admin/audit-logs
 * @access  Private (ADMIN)
 */
const getAuditLogs = async (req, res, next) => {
  try {
    const [logs] = await pool.query(`
      SELECT
        a.id,
        a.user_id,
        u.name AS user_name,
        u.email AS user_email,
        u.role AS user_role,
        a.action,
        a.entity_type,
        a.entity_id,
        a.created_at
      FROM audit_logs a
      LEFT JOIN users u ON a.user_id = u.id
      ORDER BY a.created_at DESC
      LIMIT 100
    `);

    res.status(200).json({
      success: true,
      count: logs.length,
      logs,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAdminDashboard,
  getAllUsers,
  updateUserAccount,
  getAdminBookings,
  getNoShows,
  getAnalytics,
  getResourceUsage,
  getAuditLogs,
};