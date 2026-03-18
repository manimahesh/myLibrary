const db = require('../config/database');

const PaymentMethod = {
  async findAllByUser(userId) {
    const result = await db.query(
      'SELECT * FROM payment_methods WHERE user_id = $1 ORDER BY is_default DESC, created_at DESC',
      [userId]
    );
    return result.rows;
  },

  async findById(id, userId) {
    const result = await db.query(
      'SELECT * FROM payment_methods WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
    return result.rows[0] || null;
  },

  async create(userId, data) {
    const { card_type, last_four_digits, expiry_month, expiry_year, is_default } = data;
    const result = await db.query(
      `INSERT INTO payment_methods (user_id, card_type, last_four_digits, expiry_month, expiry_year, is_default)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [userId, card_type, last_four_digits, expiry_month, expiry_year, is_default || false]
    );
    return result.rows[0];
  },

  async update(id, userId, data) {
    const { card_type, last_four_digits, expiry_month, expiry_year, is_default } = data;
    const result = await db.query(
      `UPDATE payment_methods
       SET card_type = $1, last_four_digits = $2, expiry_month = $3, expiry_year = $4, is_default = $5, updated_at = NOW()
       WHERE id = $6 AND user_id = $7
       RETURNING *`,
      [card_type, last_four_digits, expiry_month, expiry_year, is_default || false, id, userId]
    );
    return result.rows[0] || null;
  },

  async delete(id, userId) {
    const result = await db.query(
      'DELETE FROM payment_methods WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, userId]
    );
    return result.rowCount > 0;
  },
};

module.exports = PaymentMethod;
