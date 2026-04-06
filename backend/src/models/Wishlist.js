const db = require('../config/database');

const Wishlist = {
  async findAllByUser(userId) {
    const result = await db.query(
      'SELECT * FROM wishlists WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    return result.rows;
  },

  async findByBookId(userId, bookId) {
    const result = await db.query(
      'SELECT * FROM wishlists WHERE user_id = $1 AND book_id = $2',
      [userId, bookId]
    );
    return result.rows[0] || null;
  },

  async create(userId, bookId) {
    const result = await db.query(
      `INSERT INTO wishlists (user_id, book_id)
       VALUES ($1, $2)
       RETURNING *`,
      [userId, bookId]
    );
    return result.rows[0];
  },

  async updateRating(id, userId, rating) {
    const result = await db.query(
      `UPDATE wishlists
       SET rating = $1, updated_at = NOW()
       WHERE id = $2 AND user_id = $3
       RETURNING *`,
      [rating, id, userId]
    );
    return result.rows[0] || null;
  },

  async delete(id, userId) {
    const result = await db.query(
      'DELETE FROM wishlists WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, userId]
    );
    return result.rowCount > 0;
  },
};

module.exports = Wishlist;
