const request = require('supertest');
const app = require('../../app');
const { runMigrations, clearTables, closePool } = require('./helpers');

beforeAll(() => runMigrations());
afterEach(() => clearTables());
afterAll(() => closePool());

describe('POST /api/auth/register', () => {
  it('creates a new user and returns 201', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'new@example.com', password: 'password123' });
    expect(res.status).toBe(201);
    expect(res.body.user.email).toBe('new@example.com');
    expect(res.body.user.password_hash).toBeUndefined();
  });

  it('returns 409 when email is already registered', async () => {
    await request(app).post('/api/auth/register').send({ email: 'dup@example.com', password: 'password123' });
    const res = await request(app).post('/api/auth/register').send({ email: 'dup@example.com', password: 'password123' });
    expect(res.status).toBe(409);
  });

  it('returns 400 for invalid payload', async () => {
    const res = await request(app).post('/api/auth/register').send({ email: 'not-an-email', password: 'short' });
    expect(res.status).toBe(400);
  });
});

describe('POST /api/auth/login', () => {
  beforeEach(async () => {
    await request(app).post('/api/auth/register').send({ email: 'login@example.com', password: 'password123' });
  });

  it('returns token and user on valid credentials', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'login@example.com', password: 'password123' });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe('login@example.com');
  });

  it('returns 401 for wrong password', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'login@example.com', password: 'wrongpassword' });
    expect(res.status).toBe(401);
  });

  it('returns 401 for non-existent email', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'ghost@example.com', password: 'password123' });
    expect(res.status).toBe(401);
  });
});
