const db = require('../config/database');
const { validate: isValidUUID } = require('uuid');

const User = {
  async create(email, passwordHash) {
    const result = await db.query(
      'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email, first_name, last_name, created_at, updated_at',
      [email, passwordHash]
    );
    return result.rows[0];
  },

  async findByEmail(email) {
    const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    return result.rows[0] || null;
  },

  async findById(id) {
    if (!isValidUUID(id)) return null;
    const result = await db.query(
      'SELECT id, email, first_name, last_name, created_at, updated_at FROM users WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  },

  async updateProfile(id, firstName, lastName) {
    if (!isValidUUID(id)) return null;
    const result = await db.query(
      `UPDATE users SET first_name = $1, last_name = $2, updated_at = NOW()
       WHERE id = $3
       RETURNING id, email, first_name, last_name, created_at, updated_at`,
      [firstName || null, lastName || null, id]
    );
    return result.rows[0] || null;
  },

  async updatePassword(id, newHash) {
    if (!isValidUUID(id)) throw new Error(`Invalid UUID: ${id}`);
    await db.query(
      'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
      [newHash, id]
    );
  },
};

module.exports = User;
