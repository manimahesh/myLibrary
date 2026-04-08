jest.mock('../../models/User');
jest.mock('../../utils/auth');
const User = require('../../models/User');
const { hashPassword, comparePassword, generateToken, registerSchema, loginSchema } = require('../../utils/auth');
const { register, login } = require('../../controllers/authController');

function mockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe('register', () => {
  beforeEach(() => {
    registerSchema.validate = jest.fn().mockReturnValue({ value: { email: 'a@b.com', password: 'pass1234' } });
  });

  it('returns 400 on validation error', async () => {
    registerSchema.validate.mockReturnValue({ error: { details: [{ message: 'bad input' }] } });
    const req = { body: {} };
    const res = mockRes();
    await register(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 409 when email already registered', async () => {
    User.findByEmail.mockResolvedValue({ id: 'existing' });
    const req = { body: { email: 'a@b.com', password: 'pass1234' } };
    const res = mockRes();
    await register(req, res);
    expect(res.status).toHaveBeenCalledWith(409);
  });

  it('returns 201 with new user on success', async () => {
    User.findByEmail.mockResolvedValue(null);
    hashPassword.mockResolvedValue('hashed');
    User.create.mockResolvedValue({ id: 'new-id', email: 'a@b.com' });
    const req = { body: { email: 'a@b.com', password: 'pass1234' } };
    const res = mockRes();
    await register(req, res);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ user: expect.objectContaining({ email: 'a@b.com' }) });
  });

  it('returns 500 on unexpected error', async () => {
    User.findByEmail.mockRejectedValue(new Error('DB down'));
    const req = { body: { email: 'a@b.com', password: 'pass1234' } };
    const res = mockRes();
    await register(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

describe('login', () => {
  beforeEach(() => {
    loginSchema.validate = jest.fn().mockReturnValue({ value: { email: 'a@b.com', password: 'pass1234' } });
  });

  it('returns 400 on validation error', async () => {
    loginSchema.validate.mockReturnValue({ error: { details: [{ message: 'bad' }] } });
    const req = { body: {} };
    const res = mockRes();
    await login(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 401 when user not found', async () => {
    User.findByEmail.mockResolvedValue(null);
    const req = { body: { email: 'a@b.com', password: 'pass1234' } };
    const res = mockRes();
    await login(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('returns 401 when password is wrong', async () => {
    User.findByEmail.mockResolvedValue({ id: 'u1', password_hash: 'hash' });
    comparePassword.mockResolvedValue(false);
    const req = { body: { email: 'a@b.com', password: 'wrongpass' } };
    const res = mockRes();
    await login(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('returns token and user on success', async () => {
    User.findByEmail.mockResolvedValue({ id: 'u1', email: 'a@b.com', password_hash: 'hash', created_at: new Date() });
    comparePassword.mockResolvedValue(true);
    generateToken.mockReturnValue('jwt-token');
    const req = { body: { email: 'a@b.com', password: 'pass1234' } };
    const res = mockRes();
    await login(req, res);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ token: 'jwt-token' }));
  });
});
