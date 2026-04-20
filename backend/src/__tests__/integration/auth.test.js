const request = require('supertest');
const app = require('../../app');
const { runMigrations, clearTables, createTestUser, closePool } = require('./helpers');

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

  it('returns first_name and last_name in user payload', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'login@example.com', password: 'password123' });
    expect(res.status).toBe(200);
    expect(res.body.user).toHaveProperty('first_name');
    expect(res.body.user).toHaveProperty('last_name');
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

describe('GET /api/auth/me', () => {
  it('returns the current user when authenticated', async () => {
    const { token } = await createTestUser('me@example.com');
    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe('me@example.com');
  });

  it('returns 401 without a token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });
});

describe('PUT /api/auth/me', () => {
  it('updates first_name and last_name', async () => {
    const { token } = await createTestUser('update@example.com');
    const res = await request(app)
      .put('/api/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .send({ first_name: 'Jane', last_name: 'Smith' });
    expect(res.status).toBe(200);
    expect(res.body.user.first_name).toBe('Jane');
    expect(res.body.user.last_name).toBe('Smith');
  });

  it('accepts empty strings (clearing the name)', async () => {
    const { token } = await createTestUser('clear@example.com');
    const res = await request(app)
      .put('/api/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .send({ first_name: '', last_name: '' });
    expect(res.status).toBe(200);
  });

  it('returns 401 without a token', async () => {
    const res = await request(app).put('/api/auth/me').send({ first_name: 'Jane' });
    expect(res.status).toBe(401);
  });
});

describe('PUT /api/auth/change-password', () => {
  it('changes the password successfully', async () => {
    const { token } = await createTestUser('pwchange@example.com', 'password123');
    const res = await request(app)
      .put('/api/auth/change-password')
      .set('Authorization', `Bearer ${token}`)
      .send({ current_password: 'password123', new_password: 'newpassword456' });
    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Password updated successfully');
  });

  it('returns 400 when current password is wrong', async () => {
    const { token } = await createTestUser('pwwrong@example.com', 'password123');
    const res = await request(app)
      .put('/api/auth/change-password')
      .set('Authorization', `Bearer ${token}`)
      .send({ current_password: 'wrongpassword', new_password: 'newpassword456' });
    expect(res.status).toBe(400);
  });

  it('returns 400 when new_password is too short', async () => {
    const { token } = await createTestUser('pwshort@example.com', 'password123');
    const res = await request(app)
      .put('/api/auth/change-password')
      .set('Authorization', `Bearer ${token}`)
      .send({ current_password: 'password123', new_password: 'short' });
    expect(res.status).toBe(400);
  });

  it('returns 401 without a token', async () => {
    const res = await request(app)
      .put('/api/auth/change-password')
      .send({ current_password: 'password123', new_password: 'newpassword456' });
    expect(res.status).toBe(401);
  });

  it('allows login with the new password after change', async () => {
    const { token } = await createTestUser('pwverify@example.com', 'password123');
    await request(app)
      .put('/api/auth/change-password')
      .set('Authorization', `Bearer ${token}`)
      .send({ current_password: 'password123', new_password: 'newpassword456' });
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'pwverify@example.com', password: 'newpassword456' });
    expect(loginRes.status).toBe(200);
    expect(loginRes.body.token).toBeDefined();
  });
});
