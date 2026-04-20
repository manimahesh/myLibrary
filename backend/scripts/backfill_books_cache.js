/**
 * Backfill the books cache table for all book_ids in wishlists and read_books.
 * Processes 10 books per batch with a 15-minute pause between batches,
 * and a 300ms gap between individual API calls within each batch.
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
const BATCH_SIZE = 10;
const BATCH_PAUSE_MS = 15 * 60 * 1000; // 15 minutes

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
  const totalBatches = Math.ceil(rows.length / BATCH_SIZE);

  for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
    const batch = rows.slice(batchIndex * BATCH_SIZE, (batchIndex + 1) * BATCH_SIZE);
    console.log(`\nBatch ${batchIndex + 1}/${totalBatches} (${batch.length} books)`);

    for (const { book_id } of batch) {
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

    if (batchIndex < totalBatches - 1) {
      const pauseMin = BATCH_PAUSE_MS / 60000;
      console.log(`\nBatch ${batchIndex + 1} complete. Pausing ${pauseMin} minutes before next batch...`);
      await delay(BATCH_PAUSE_MS);
    }
  }

  console.log(`\nDone. Cached: ${ok}, Failed/Not found: ${failed}`);

  await pool.end();
  // Close the app-level db pool used by getBookDetails via googleBooksService
  const appDb = require('../src/config/database');
  await appDb.end();
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
