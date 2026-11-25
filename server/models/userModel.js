const { pool } = require('../config/db');

const findUserByEmail = async (email) => {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  const [rows] = await pool.execute(
    `SELECT id, name, email, password_hash, role, status, created_at
     FROM users
     WHERE LOWER(TRIM(email)) = ?
     LIMIT 1`,
    [normalizedEmail]
  );
  return rows[0] || null;
};

const findUserById = async (id) => {
  const [rows] = await pool.execute(
    `SELECT id, name, email, role, status, created_at
     FROM users
     WHERE id = ?
     LIMIT 1`,
    [id]
  );
  return rows[0] || null;
};

const createUser = async ({ name, email, passwordHash, role = 'STUDENT' }) => {
  const [result] = await pool.execute(
    `INSERT INTO users (name, email, password_hash, role, status)
     VALUES (?, ?, ?, ?, 'ACTIVE')`,
    [name.trim(), email.trim().toLowerCase(), passwordHash, role]
  );
  return result.insertId;
};

module.exports = {
  findUserByEmail,
  findUserById,
  createUser,
};