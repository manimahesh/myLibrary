const request = require('supertest');
const app = require('../../app');
const { runMigrations, clearTables, createTestUser, closePool } = require('./helpers');

let token;

beforeAll(() => runMigrations());
beforeEach(async () => {
  await clearTables();
  ({ token } = await createTestUser());
});
afterAll(() => closePool());

describe('GET /api/read-books', () => {
  it('returns 401 without auth', async () => {
    const res = await request(app).get('/api/read-books');
    expect(res.status).toBe(401);
  });

  it('returns empty list for new user', async () => {
    const res = await request(app).get('/api/read-books').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.readBooks).toEqual([]);
  });
});

describe('POST /api/read-books', () => {
  it('marks a book as read', async () => {
    const res = await request(app)
      .post('/api/read-books')
      .set('Authorization', `Bearer ${token}`)
      .send({ book_id: 'book-xyz' });
    expect(res.status).toBe(201);
    expect(res.body.item.book_id).toBe('book-xyz');
  });

  it('accepts a custom read_at date', async () => {
    const res = await request(app)
      .post('/api/read-books')
      .set('Authorization', `Bearer ${token}`)
      .send({ book_id: 'book-xyz', read_at: '2023-06-15' });
    expect(res.status).toBe(201);
    expect(res.body.item.read_at).toContain('2023-06-15');
  });

  it('returns 409 on duplicate marking', async () => {
    await request(app).post('/api/read-books').set('Authorization', `Bearer ${token}`).send({ book_id: 'book-xyz' });
    const res = await request(app).post('/api/read-books').set('Authorization', `Bearer ${token}`).send({ book_id: 'book-xyz' });
    expect(res.status).toBe(409);
    expect(res.body.item).toBeDefined();
  });

  it('isolates read books by user', async () => {
    const { token: otherToken } = await createTestUser('other2@example.com');
    await request(app).post('/api/read-books').set('Authorization', `Bearer ${token}`).send({ book_id: 'book-xyz' });
    const res = await request(app).get('/api/read-books').set('Authorization', `Bearer ${otherToken}`);
    expect(res.body.readBooks).toEqual([]);
  });
});

describe('DELETE /api/read-books/:id', () => {
  it('unmarks a book as read', async () => {
    const addRes = await request(app).post('/api/read-books').set('Authorization', `Bearer ${token}`).send({ book_id: 'book-xyz' });
    const recordId = addRes.body.item.id;
    const res = await request(app).delete(`/api/read-books/${recordId}`).set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
  });

  it('returns 404 for non-existent record', async () => {
    const res = await request(app)
      .delete('/api/read-books/550e8400-e29b-41d4-a716-446655440000')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });

  it('returns 400 for invalid UUID', async () => {
    const res = await request(app).delete('/api/read-books/not-a-uuid').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(400);
  });
});
