const db = require('../config/database');

const Wishlist = {
  async findAllByUser(userId) {
    const result = await db.query(
      `SELECT w.*, b.title, b.author, b.thumbnail
       FROM wishlists w
       LEFT JOIN books b ON b.book_id = w.book_id
       WHERE w.user_id = $1
       ORDER BY w.created_at DESC, w.id`,
      [userId]
    );
    return result.rows;
  },

  async findPageByUser(userId, limit, offset) {
    const [dataRes, countRes] = await Promise.all([
      db.query(
        `SELECT w.*, b.title, b.author, b.thumbnail
         FROM wishlists w
         LEFT JOIN books b ON b.book_id = w.book_id
         WHERE w.user_id = $1
         ORDER BY w.created_at DESC, w.id
         LIMIT $2 OFFSET $3`,
        [userId, limit, offset]
      ),
      db.query('SELECT COUNT(*) FROM wishlists WHERE user_id = $1', [userId]),
    ]);
    return { items: dataRes.rows, total: parseInt(countRes.rows[0].count, 10) };
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
