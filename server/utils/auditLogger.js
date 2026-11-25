const { pool } = require('../config/db');

/**
 * Records an action into the audit_logs table.
 * Accepts an optional transaction connection so logs can participate in transactions if needed.
 */
const logAudit = async ({ userId = null, action, entityType, entityId = null }, dbConn = null) => {
  try {
    const executor = dbConn || pool;
    await executor.execute(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id)
       VALUES (?, ?, ?, ?)`,
      [userId, action, entityType, entityId]
    );
  } catch (err) {
    // Audit logging should not crash the main business operation if non-critical
    console.error('Audit Log Error:', err.message);
  }
};

module.exports = { logAudit };