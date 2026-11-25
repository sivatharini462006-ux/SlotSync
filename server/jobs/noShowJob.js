const cron = require('node-cron');
const { pool } = require('../config/db');
const { logAudit } = require('../utils/auditLogger');

/**
 * Processes expired grace-period reservations (15-minute no-show rule)
 * and transitions finished CHECKED_IN reservations to COMPLETED.
 */
const processAutomatedBookingStatuses = async () => {
  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    // 1. Find CONFIRMED/PENDING bookings where start_time + 15 mins < NOW() and not checked in
    const [noShowCandidates] = await connection.execute(
      `SELECT id, booking_code, resource_id
       FROM bookings
       WHERE status IN ('PENDING', 'CONFIRMED')
         AND check_in_time IS NULL
         AND TIMESTAMP(booking_date, start_time) <= DATE_SUB(NOW(), INTERVAL 15 MINUTE)
       FOR UPDATE`
    );

    for (const booking of noShowCandidates) {
      await connection.execute(
        `UPDATE bookings
         SET status = 'NO_SHOW',
             released_at = NOW()
         WHERE id = ?`,
        [booking.id]
      );

      await logAudit(
        {
          userId: null,
          action: `AUTO_NO_SHOW_RELEASED_${booking.booking_code}`,
          entityType: 'BOOKING',
          entityId: booking.id,
        },
        connection
      );
    }

    // 2. Mark CHECKED_IN bookings whose end_time has passed as COMPLETED
    const [completedCandidates] = await connection.execute(
      `SELECT id, booking_code
       FROM bookings
       WHERE status = 'CHECKED_IN'
         AND TIMESTAMP(booking_date, end_time) < NOW()
       FOR UPDATE`
    );

    for (const booking of completedCandidates) {
      await connection.execute(
        `UPDATE bookings
         SET status = 'COMPLETED'
         WHERE id = ?`,
        [booking.id]
      );
    }

    await connection.commit();

    if (noShowCandidates.length > 0 || completedCandidates.length > 0) {
      console.log(
        `⏱️ [Cron] Released ${noShowCandidates.length} NO_SHOW slot(s), completed ${completedCandidates.length} booking(s).`
      );
    }

    return {
      releasedCount: noShowCandidates.length,
      completedCount: completedCandidates.length,
    };
  } catch (error) {
    if (connection) {
      try {
        await connection.rollback();
      } catch (e) {
        console.error('Cron rollback error:', e.message);
      }
    }
    console.error('❌ [Cron] Automated No-Show Job Error:', error.message);
  } finally {
    if (connection) connection.release();
  }
};

/**
 * Starts the node-cron scheduler (runs every minute)
 */
const startNoShowCronJob = () => {
  cron.schedule('* * * * *', async () => {
    await processAutomatedBookingStatuses();
  });
  console.log('⏱️ Automated 15-minute No-Show Release Cron Job scheduled (every 1 min).');
};

module.exports = {
  startNoShowCronJob,
  processAutomatedBookingStatuses,
};