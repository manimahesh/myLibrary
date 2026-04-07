const db = require('../config/database');

const ReadBook = {
  async findAllByUser(userId) {
    const result = await db.query(
      'SELECT * FROM read_books WHERE user_id = $1 ORDER BY read_at DESC',
      [userId]
    );
    return result.rows;
  },

  async findByBookId(userId, bookId) {
    const result = await db.query(
      'SELECT * FROM read_books WHERE user_id = $1 AND book_id = $2',
      [userId, bookId]
    );
    return result.rows[0] || null;
  },

  async create(userId, bookId) {
    const result = await db.query(
      `INSERT INTO read_books (user_id, book_id)
       VALUES ($1, $2)
       RETURNING *`,
      [userId, bookId]
    );
    return result.rows[0];
  },

  async delete(id, userId) {
    const result = await db.query(
      'DELETE FROM read_books WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, userId]
    );
    return result.rowCount > 0;
  },
};

module.exports = ReadBook;
