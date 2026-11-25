const mysql = require('mysql2/promise');
require('dotenv').config();

// Create a connection pool using InnoDB-compatible settings
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'slotsync_db',
  port: Number(process.env.DB_PORT) || 3306,
  waitForConnections: true,
  connectionLimit: 15, // Supports concurrent booking requests cleanly
  queueLimit: 0,
  timezone: '+00:00',
  dateStrings: true, // Returns DATE and TIME as exact 'YYYY-MM-DD' and 'HH:MM:SS' strings
});

/**
 * Verifies database connectivity on server startup
 */
const testConnection = async () => {
  let connection;
  try {
    connection = await pool.getConnection();
    await connection.ping();
    console.log(`✅ Connected to MySQL database: ${process.env.DB_NAME || 'slotsync_db'}`);
  } catch (error) {
    console.error('❌ MySQL Connection Failed:', error.message);
    process.exit(1);
  } finally {
    if (connection) connection.release();
  }
};

module.exports = {
  pool,
  testConnection,
};