const db = require('../config/database');

const ReadBook = {
  async findAllByUser(userId) {
    const result = await db.query(
      `SELECT r.*, b.title, b.author, b.thumbnail
       FROM read_books r
       LEFT JOIN books b ON b.book_id = r.book_id
       WHERE r.user_id = $1
       ORDER BY r.read_at DESC, r.id`,
      [userId]
    );
    return result.rows;
  },

  async findPageByUser(userId, limit, offset) {
    const [dataRes, countRes] = await Promise.all([
      db.query(
        `SELECT r.*, b.title, b.author, b.thumbnail
         FROM read_books r
         LEFT JOIN books b ON b.book_id = r.book_id
         WHERE r.user_id = $1
         ORDER BY r.read_at DESC, r.id
         LIMIT $2 OFFSET $3`,
        [userId, limit, offset]
      ),
      db.query('SELECT COUNT(*) FROM read_books WHERE user_id = $1', [userId]),
    ]);
    return { items: dataRes.rows, total: parseInt(countRes.rows[0].count, 10) };
  },

  async findByBookId(userId, bookId) {
    const result = await db.query(
      'SELECT * FROM read_books WHERE user_id = $1 AND book_id = $2',
      [userId, bookId]
    );
    return result.rows[0] || null;
  },

  async create(userId, bookId, readAt) {
    const result = await db.query(
      `INSERT INTO read_books (user_id, book_id, read_at)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [userId, bookId, readAt || new Date()]
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
