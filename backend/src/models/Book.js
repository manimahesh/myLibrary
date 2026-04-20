const db = require('../config/database');

const Book = {
  async upsert({ book_id, title, author, thumbnail, description, published_date, page_count, average_rating, ratings_count, publisher, categories }) {
    const result = await db.query(
      `INSERT INTO books
         (book_id, title, author, thumbnail, description, published_date, page_count, average_rating, ratings_count, publisher, categories, cached_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,NOW())
       ON CONFLICT (book_id) DO UPDATE SET
         title          = EXCLUDED.title,
         author         = EXCLUDED.author,
         thumbnail      = EXCLUDED.thumbnail,
         description    = EXCLUDED.description,
         published_date = EXCLUDED.published_date,
         page_count     = EXCLUDED.page_count,
         average_rating = EXCLUDED.average_rating,
         ratings_count  = EXCLUDED.ratings_count,
         publisher      = EXCLUDED.publisher,
         categories     = EXCLUDED.categories,
         cached_at      = NOW()
       RETURNING *`,
      [book_id, title, author, thumbnail, description, published_date, page_count, average_rating, ratings_count, publisher,
       Array.isArray(categories) ? categories.join(', ') : (categories || null)]
    );
    return result.rows[0];
  },

  async findById(book_id) {
    const result = await db.query('SELECT * FROM books WHERE book_id = $1', [book_id]);
    return result.rows[0] || null;
  },
};

module.exports = Book;
