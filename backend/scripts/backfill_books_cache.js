/**
 * Backfill the books cache table for all book_ids in wishlists and read_books.
 * Fetches sequentially with a 300ms gap to avoid Google Books 429s.
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const { Pool } = require('pg');
const config = require('../src/config');
const { getBookDetails } = require('../src/services/googleBooksService');

const pool = new Pool({
  host: config.db.host,
  port: config.db.port,
  database: config.db.database,
  user: config.db.user,
  password: config.db.password,
});

const DELAY_MS = 300;
const delay = ms => new Promise(r => setTimeout(r, ms));

async function main() {
  const { rows } = await pool.query(`
    SELECT DISTINCT book_id FROM (
      SELECT book_id FROM wishlists
      UNION
      SELECT book_id FROM read_books
    ) t
    WHERE book_id NOT IN (SELECT book_id FROM books)
    ORDER BY book_id
  `);

  console.log(`${rows.length} book IDs to backfill (already-cached are skipped)`);

  let ok = 0, failed = 0;

  for (const { book_id } of rows) {
    try {
      const book = await getBookDetails(book_id);
      if (book) {
        console.log(`  ✓ [${book_id}] ${book.title}`);
        ok++;
      } else {
        console.log(`  - [${book_id}] not found on Google Books`);
        failed++;
      }
    } catch (err) {
      console.warn(`  ✗ [${book_id}] ${err.message}`);
      failed++;
    }
    await delay(DELAY_MS);
  }

  console.log(`\nDone. Cached: ${ok}, Failed/Not found: ${failed}`);
  await pool.end();
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
