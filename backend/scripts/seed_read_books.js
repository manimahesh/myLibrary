/**
 * Seed read_books from enriched_books.csv.
 * Maps book_id = isbn:{isbn13} when a valid ISBN-13 is present,
 * otherwise falls back to title:{slug}. read_at defaults to today.
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const config = require('../src/config');

const CSV_PATH = path.join(__dirname, '../../enriched_books.csv');
const USER_EMAIL = 'manimahesh1@gmail.com';
const TODAY = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

const INVALID = new Set(['n/a', 'not found', 'error', '', 'null', 'undefined']);

function isValidIsbn(val) {
  if (!val) return false;
  const clean = val.trim().replace(/-/g, '');
  return !INVALID.has(clean.toLowerCase()) && /^\d{13}$/.test(clean);
}

function toSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 200);
}

function parseValue(val) {
  if (!val) return null;
  const t = val.trim();
  return INVALID.has(t.toLowerCase()) ? null : t;
}

function parseCsv(content) {
  const lines = content.split('\n').filter(Boolean);
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    // Handle quoted fields (commas inside quotes)
    const fields = [];
    let current = '';
    let inQuotes = false;

    for (let c = 0; c < lines[i].length; c++) {
      const ch = lines[i][c];
      if (ch === '"') {
        inQuotes = !inQuotes;
      } else if (ch === ',' && !inQuotes) {
        fields.push(current.trim());
        current = '';
      } else {
        current += ch;
      }
    }
    fields.push(current.trim());

    const [title, , , , isbn13] = fields;
    if (!title) continue;

    const cleanIsbn = isbn13 ? isbn13.trim().replace(/-/g, '') : '';
    const bookId = isValidIsbn(cleanIsbn)
      ? `isbn:${cleanIsbn}`
      : `title:${toSlug(title)}`;

    rows.push({ title, bookId });
  }

  return rows;
}

async function main() {
  const pool = new Pool({
    host: config.db.host,
    port: config.db.port,
    database: config.db.database,
    user: config.db.user,
    password: config.db.password,
  });

  try {
    // Look up the user
    const userRes = await pool.query('SELECT id FROM users WHERE email = $1', [USER_EMAIL]);
    if (userRes.rows.length === 0) {
      console.error(`User not found: ${USER_EMAIL}`);
      process.exit(1);
    }
    const userId = userRes.rows[0].id;
    console.log(`User ID: ${userId}`);

    const content = fs.readFileSync(CSV_PATH, 'utf8');
    const books = parseCsv(content);
    console.log(`Parsed ${books.length} books from CSV`);

    let inserted = 0;
    let skipped = 0;

    for (const { title, bookId } of books) {
      try {
        await pool.query(
          `INSERT INTO read_books (user_id, book_id, read_at)
           VALUES ($1, $2, $3)
           ON CONFLICT (user_id, book_id) DO NOTHING`,
          [userId, bookId, TODAY]
        );
        inserted++;
        console.log(`  ✓ ${bookId.slice(0, 60)}`);
      } catch (err) {
        console.warn(`  ✗ Skipped "${title}": ${err.message}`);
        skipped++;
      }
    }

    console.log(`\nDone. Inserted: ${inserted}, Skipped (duplicate/error): ${skipped}`);
  } finally {
    await pool.end();
  }
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
