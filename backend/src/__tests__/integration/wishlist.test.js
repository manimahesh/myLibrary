const request = require('supertest');
const app = require('../../app');
const { runMigrations, clearTables, createTestUser, closePool } = require('./helpers');

let token;
let userId;

beforeAll(() => runMigrations());
beforeEach(async () => {
  await clearTables();
  const { user, token: t } = await createTestUser();
  token = t;
  userId = user.id;
});
afterAll(() => closePool());

describe('GET /api/wishlist', () => {
  it('returns 401 without auth', async () => {
    const res = await request(app).get('/api/wishlist');
    expect(res.status).toBe(401);
  });

  it('returns empty wishlist for new user', async () => {
    const res = await request(app).get('/api/wishlist').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.wishlist).toEqual([]);
  });
});

describe('POST /api/wishlist', () => {
  it('adds a book to the wishlist', async () => {
    const res = await request(app)
      .post('/api/wishlist')
      .set('Authorization', `Bearer ${token}`)
      .send({ book_id: 'book-abc' });
    expect(res.status).toBe(201);
    expect(res.body.item.book_id).toBe('book-abc');
  });

  it('returns 409 on duplicate add', async () => {
    await request(app).post('/api/wishlist').set('Authorization', `Bearer ${token}`).send({ book_id: 'book-abc' });
    const res = await request(app).post('/api/wishlist').set('Authorization', `Bearer ${token}`).send({ book_id: 'book-abc' });
    expect(res.status).toBe(409);
  });

  it('isolates wishlist by user', async () => {
    const { token: otherToken } = await createTestUser('other@example.com');
    await request(app).post('/api/wishlist').set('Authorization', `Bearer ${token}`).send({ book_id: 'book-abc' });
    const res = await request(app).get('/api/wishlist').set('Authorization', `Bearer ${otherToken}`);
    expect(res.body.wishlist).toEqual([]);
  });
});

describe('DELETE /api/wishlist/:id', () => {
  it('removes a wishlist item', async () => {
    const addRes = await request(app).post('/api/wishlist').set('Authorization', `Bearer ${token}`).send({ book_id: 'book-abc' });
    const itemId = addRes.body.item.id;
    const res = await request(app).delete(`/api/wishlist/${itemId}`).set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
  });

  it('returns 404 for non-existent item', async () => {
    const res = await request(app)
      .delete('/api/wishlist/550e8400-e29b-41d4-a716-446655440000')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });
});
