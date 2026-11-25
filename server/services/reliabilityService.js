const { pool } = require('../config/db');

/**
 * Returns tier rules based on the user's current reliability_score (0 - 100)
 */
const getFairnessPolicy = (score = 100, role = 'STUDENT') => {
  if (role === 'ADMIN' || role === 'FACULTY') {
    return {
      score,
      tier: 'FACULTY_PRIORITY',
      maxAdvanceDays: 30,
      maxActiveBookings: 5,
      badgeColor: 'indigo',
      summary: 'Faculty/Admin Priority Access (up to 30 days ahead, 5 active slots)',
    };
  }

  if (score >= 80) {
    return {
      score,
      tier: 'EXCELLENT',
      maxAdvanceDays: 14,
      maxActiveBookings: 3,
      badgeColor: 'emerald',
      summary: 'High Reliability Tier: Book up to 14 days in advance (max 3 active slots)',
    };
  }

  if (score >= 50) {
    return {
      score,
      tier: 'GOOD',
      maxAdvanceDays: 7,
      maxActiveBookings: 2,
      badgeColor: 'amber',
      summary: 'Standard Tier: Book up to 7 days in advance (max 2 active slots)',
    };
  }

  return {
    score,
    tier: 'RESTRICTED',
    maxAdvanceDays: 1,
    maxActiveBookings: 1,
    badgeColor: 'rose',
    summary: 'Cooldown Tier (Score < 50): Restricted to 24-hr advance booking & 1 active slot until check-in streak improves.',
  };
};

/**
 * Validates advance-booking window & concurrent active reservations before locking a slot
 */
const enforceFairnessRules = async ({ userId, bookingDate }) => {
  const [users] = await pool.execute(
    'SELECT id, role, reliability_score FROM users WHERE id = ?',
    [userId]
  );

  if (users.length === 0) {
    throw Object.assign(new Error('User not found.'), { statusCode: 404 });
  }

  const user = users[0];
  const policy = getFairnessPolicy(user.reliability_score, user.role);

  // 1. Check advance booking window (in days)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(`${bookingDate}T00:00:00`);
  const diffDays = Math.ceil((target - today) / (1000 * 60 * 60 * 24));

  if (diffDays > policy.maxAdvanceDays) {
    throw Object.assign(
      new Error(
        `Fairness Rule (${policy.tier} • Score ${policy.score}/100): You can only book up to ${policy.maxAdvanceDays} day(s) in advance.`
      ),
      { statusCode: 403 }
    );
  }

  // 2. Check concurrent active bookings count
  const [activeRows] = await pool.execute(
    `SELECT COUNT(*) AS active_count
     FROM bookings
     WHERE user_id = ?
       AND status IN ('PENDING', 'CONFIRMED', 'CHECKED_IN')
       AND TIMESTAMP(booking_date, end_time) >= NOW()`,
    [userId]
  );

  const activeCount = Number(activeRows[0]?.active_count || 0);
  if (activeCount >= policy.maxActiveBookings) {
    throw Object.assign(
      new Error(
        `Fairness Limit (${policy.tier} • Score ${policy.score}/100): You already have ${activeCount}/${policy.maxActiveBookings} active reservation(s).`
      ),
      { statusCode: 403 }
    );
  }

  return policy;
};

/**
 * Adjusts user's reliability score safely within [0, 100]
 */
const adjustReliabilityScore = async (userId, delta, reason) => {
  await pool.execute(
    `UPDATE users
     SET reliability_score = LEAST(100, GREATEST(0, CAST(reliability_score AS SIGNED) + ?))
     WHERE id = ?`,
    [delta, userId]
  );

  await pool.execute(
    `INSERT INTO audit_logs (user_id, action, entity_type, entity_id)
     VALUES (?, ?, 'USER', ?)`,
    [userId, `${reason} (${delta >= 0 ? `+${delta}` : delta})`, userId]
  );
};

/**
 * Fetches user's reliability breakdown (score, tier, check-ins, no-shows)
 */
const getUserReliabilityProfile = async (userId) => {
  const [users] = await pool.execute(
    'SELECT id, name, role, reliability_score FROM users WHERE id = ?',
    [userId]
  );

  if (users.length === 0) return null;

  const [stats] = await pool.execute(
    `SELECT
       COUNT(*) AS total_bookings,
       SUM(CASE WHEN status IN ('CHECKED_IN', 'COMPLETED') THEN 1 ELSE 0 END) AS verified_checkins,
       SUM(CASE WHEN status = 'NO_SHOW' THEN 1 ELSE 0 END) AS no_shows,
       SUM(CASE WHEN status = 'CANCELLED' THEN 1 ELSE 0 END) AS cancelled
     FROM bookings
     WHERE user_id = ?`,
    [userId]
  );

  const user = users[0];
  const policy = getFairnessPolicy(user.reliability_score, user.role);

  return {
    ...policy,
    stats: {
      totalBookings: Number(stats[0]?.total_bookings || 0),
      verifiedCheckins: Number(stats[0]?.verified_checkins || 0),
      noShows: Number(stats[0]?.no_shows || 0),
      cancelled: Number(stats[0]?.cancelled || 0),
    },
  };
};

module.exports = {
  getFairnessPolicy,
  enforceFairnessRules,
  adjustReliabilityScore,
  getUserReliabilityProfile,
};