const { pool } = require('../config/db');

const OPERATING_HOURS = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19]; // 08:00 to 19:00
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/**
 * Generates a 7-day x 12-hour historical occupancy heatmap + top 3 low-congestion slot recommendations
 */
const getSmartRecommendations = async ({ resourceId, targetDate }) => {
  const dateObj = targetDate ? new Date(`${targetDate}T00:00:00`) : new Date();
  const targetDow = dateObj.getDay() + 1; // MySQL DAYOFWEEK(): 1 = Sunday ... 7 = Saturday
  const formattedDate = dateObj.toISOString().split('T')[0];

  // 1. Fetch resource info (optional filter if resourceId is provided)
  let resourceFilterSql = '';
  const queryParams = [];
  if (resourceId) {
    resourceFilterSql = 'AND b.resource_id = ?';
    queryParams.push(Number(resourceId));
  }

  // 2. Aggregate historical booking counts by Day-of-Week & Hour-of-Day
  const [historicalRows] = await pool.execute(
    `SELECT DAYOFWEEK(b.booking_date) AS dow,
            HOUR(b.start_time) AS start_hour,
            HOUR(b.end_time) AS end_hour,
            COUNT(*) AS total_bookings
     FROM bookings b
     WHERE b.status IN ('CONFIRMED', 'CHECKED_IN', 'COMPLETED')
       ${resourceFilterSql}
     GROUP BY dow, start_hour, end_hour`,
    queryParams
  );

  // Build 7x12 demand matrix
  const matrix = {};
  for (let d = 1; d <= 7; d++) {
    matrix[d] = {};
    for (const h of OPERATING_HOURS) {
      matrix[d][h] = 0;
    }
  }

  for (const row of historicalRows) {
    const startH = Math.max(8, Number(row.start_hour));
    const endH = Math.min(20, Math.max(startH + 1, Number(row.end_hour)));
    for (let h = startH; h < endH; h++) {
      if (matrix[row.dow] && matrix[row.dow][h] !== undefined) {
        matrix[row.dow][h] += Number(row.total_bookings);
      }
    }
  }

  // Find max count for normalization (0 to 100%)
  let maxDemand = 1;
  for (let d = 1; d <= 7; d++) {
    for (const h of OPERATING_HOURS) {
      if (matrix[d][h] > maxDemand) maxDemand = matrix[d][h];
    }
  }

  // 3. Check already-booked slots on the exact targetDate so we never recommend an occupied slot
  const occupiedHours = new Set();
  if (resourceId) {
    const [existingOnDate] = await pool.execute(
      `SELECT start_time, end_time FROM bookings
       WHERE resource_id = ?
         AND booking_date = ?
         AND status IN ('PENDING', 'CONFIRMED', 'CHECKED_IN')`,
      [Number(resourceId), formattedDate]
    );

    for (const b of existingOnDate) {
      const sH = Number(String(b.start_time).slice(0, 2));
      const eH = Number(String(b.end_time).slice(0, 2));
      for (let h = sH; h < eH; h++) {
        occupiedHours.add(h);
      }
    }
  }

  // 4. Score every open 1-hour slot on targetDate
  const scoredSlots = OPERATING_HOURS.filter((h) => !occupiedHours.has(h)).map((h) => {
    const demandCount = matrix[targetDow]?.[h] || 0;
    const congestionPct = Math.round((demandCount / maxDemand) * 100);
    const label =
      congestionPct <= 30 ? 'QUIET' : congestionPct <= 70 ? 'MODERATE' : 'PEAK';

    const startStr = `${String(h).padStart(2, '0')}:00`;
    const endStr = `${String(h + 1).padStart(2, '0')}:00`;

    return {
      start_time: startStr,
      end_time: endStr,
      historical_bookings: demandCount,
      congestion_pct: congestionPct,
      crowd_level: label,
      reason:
        label === 'QUIET'
          ? 'Low historical traffic — highest chance of uninterrupted focus'
          : label === 'MODERATE'
          ? 'Balanced campus availability'
          : 'High-demand window — book early to lock slot',
    };
  });

  // Sort by lowest historical congestion first, then earliest convenient hour
  const topRecommendations = [...scoredSlots]
    .sort((a, b) => a.congestion_pct - b.congestion_pct || a.start_time.localeCompare(b.start_time))
    .slice(0, 3);

  // Format heatmap array for easy React rendering
  const heatmap = [1, 2, 3, 4, 5, 6, 7].map((dow) => ({
    dow,
    day: DAY_NAMES[dow - 1],
    hours: OPERATING_HOURS.map((h) => {
      const count = matrix[dow][h];
      const intensity = Math.round((count / maxDemand) * 100);
      return {
        hour: `${String(h).padStart(2, '0')}:00`,
        count,
        intensity,
      };
    }),
  }));

  return {
    target_date: formattedDate,
    day_name: DAY_NAMES[targetDow - 1],
    recommendations: topRecommendations,
    heatmap,
  };
};

module.exports = { getSmartRecommendations };