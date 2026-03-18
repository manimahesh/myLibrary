const db = require('../config/database');

const Address = {
  async findAllByUser(userId) {
    const result = await db.query(
      'SELECT * FROM addresses WHERE user_id = $1 ORDER BY is_default DESC, created_at DESC',
      [userId]
    );
    return result.rows;
  },

  async findById(id, userId) {
    const result = await db.query(
      'SELECT * FROM addresses WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
    return result.rows[0] || null;
  },

  async create(userId, data) {
    const { street, city, state, postal_code, country, is_default } = data;
    const result = await db.query(
      `INSERT INTO addresses (user_id, street, city, state, postal_code, country, is_default)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [userId, street, city, state, postal_code, country, is_default || false]
    );
    return result.rows[0];
  },

  async update(id, userId, data) {
    const { street, city, state, postal_code, country, is_default } = data;
    const result = await db.query(
      `UPDATE addresses
       SET street = $1, city = $2, state = $3, postal_code = $4, country = $5, is_default = $6, updated_at = NOW()
       WHERE id = $7 AND user_id = $8
       RETURNING *`,
      [street, city, state, postal_code, country, is_default || false, id, userId]
    );
    return result.rows[0] || null;
  },

  async delete(id, userId) {
    const result = await db.query(
      'DELETE FROM addresses WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, userId]
    );
    return result.rowCount > 0;
  },
};

module.exports = Address;
