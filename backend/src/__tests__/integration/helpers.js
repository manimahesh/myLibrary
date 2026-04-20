/**
 * Integration test helpers.
 * Requires a running PostgreSQL instance with TEST_DB_NAME (default: mylibrary_test).
 * Set env vars via backend/.env.test or environment before running:
 *   TEST_DB_HOST, TEST_DB_PORT, TEST_DB_NAME, TEST_DB_USER, TEST_DB_PASSWORD
 */
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const { generateToken } = require('../../utils/auth');
const { hashPassword } = require('../../utils/auth');

const pool = new Pool({
  host: process.env.TEST_DB_HOST || process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.TEST_DB_PORT || process.env.DB_PORT, 10) || 5432,
  database: process.env.TEST_DB_NAME || 'mylibrary_test',
  user: process.env.TEST_DB_USER || process.env.DB_USER || 'postgres',
  password: process.env.TEST_DB_PASSWORD || process.env.DB_PASSWORD || '',
});

const MIGRATIONS_DIR = path.join(__dirname, '../../migrations');

async function runMigrations() {
  const files = fs.readdirSync(MIGRATIONS_DIR).sort();
  for (const file of files) {
    if (!file.endsWith('.sql')) continue;
    const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8');
    await pool.query(sql);
  }
}

async function clearTables() {
  await pool.query(`
    TRUNCATE TABLE book_summaries, read_books, wishlists, payment_methods, addresses, users, books
    RESTART IDENTITY CASCADE
  `);
}

async function createTestUser(email = 'test@example.com', password = 'password123') {
  const hash = await hashPassword(password);
  const result = await pool.query(
    'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email',
    [email, hash]
  );
  const user = result.rows[0];
  const token = generateToken(user.id);
  return { user, token };
}

async function closePool() {
  await pool.end();
}

module.exports = { pool, runMigrations, clearTables, createTestUser, closePool };
