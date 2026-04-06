const db = require('../config/database');

const BookSummary = {
  async findByUserAndBook(userId, bookId) {
    const result = await db.query(
      'SELECT * FROM book_summaries WHERE user_id = $1 AND book_id = $2',
      [userId, bookId]
    );
    return result.rows[0] || null;
  },

  async create(userId, bookId, summaryText) {
    const result = await db.query(
      `INSERT INTO book_summaries (user_id, book_id, summary_text)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [userId, bookId, summaryText]
    );
    return result.rows[0];
  },

  async update(id, userId, summaryText) {
    const result = await db.query(
      `UPDATE book_summaries
       SET summary_text = $1, updated_at = NOW()
       WHERE id = $2 AND user_id = $3
       RETURNING *`,
      [summaryText, id, userId]
    );
    return result.rows[0] || null;
  },

  async delete(id, userId) {
    const result = await db.query(
      'DELETE FROM book_summaries WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, userId]
    );
    return result.rowCount > 0;
  },
};

module.exports = BookSummary;
