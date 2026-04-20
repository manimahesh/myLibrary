jest.mock('../../models/User');
jest.mock('../../utils/auth');
const User = require('../../models/User');
const { hashPassword, comparePassword, generateToken, registerSchema, loginSchema, updateProfileSchema, changePasswordSchema } = require('../../utils/auth');
const { register, login, getMe, updateMe, changePassword } = require('../../controllers/authController');

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
    User.findByEmail.mockResolvedValue({ id: 'u1', email: 'a@b.com', first_name: 'Jane', last_name: 'Smith', password_hash: 'hash', created_at: new Date() });
    comparePassword.mockResolvedValue(true);
    generateToken.mockReturnValue('jwt-token');
    const req = { body: { email: 'a@b.com', password: 'pass1234' } };
    const res = mockRes();
    await login(req, res);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ token: 'jwt-token' }));
    expect(res.json.mock.calls[0][0].user).toMatchObject({ email: 'a@b.com', first_name: 'Jane', last_name: 'Smith' });
  });
});

describe('getMe', () => {
  it('returns the user when found', async () => {
    const user = { id: 'u1', email: 'a@b.com', first_name: 'Jane', last_name: 'Smith' };
    User.findById.mockResolvedValue(user);
    const req = { user: { userId: 'u1' } };
    const res = mockRes();
    await getMe(req, res);
    expect(res.json).toHaveBeenCalledWith({ user });
  });

  it('returns 404 when user not found', async () => {
    User.findById.mockResolvedValue(null);
    const req = { user: { userId: 'no-such' } };
    const res = mockRes();
    await getMe(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('returns 500 on unexpected error', async () => {
    User.findById.mockRejectedValue(new Error('DB down'));
    const req = { user: { userId: 'u1' } };
    const res = mockRes();
    await getMe(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

describe('updateMe', () => {
  beforeEach(() => {
    updateProfileSchema.validate = jest.fn().mockReturnValue({ value: { first_name: 'Jane', last_name: 'Smith' } });
  });

  it('returns updated user on success', async () => {
    const updated = { id: 'u1', email: 'a@b.com', first_name: 'Jane', last_name: 'Smith' };
    User.updateProfile.mockResolvedValue(updated);
    const req = { user: { userId: 'u1' }, body: { first_name: 'Jane', last_name: 'Smith' } };
    const res = mockRes();
    await updateMe(req, res);
    expect(res.json).toHaveBeenCalledWith({ user: updated });
  });

  it('returns 400 on validation error', async () => {
    updateProfileSchema.validate.mockReturnValue({ error: { details: [{ message: 'bad' }] } });
    const req = { user: { userId: 'u1' }, body: {} };
    const res = mockRes();
    await updateMe(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 500 on unexpected error', async () => {
    User.updateProfile.mockRejectedValue(new Error('DB down'));
    const req = { user: { userId: 'u1' }, body: {} };
    const res = mockRes();
    await updateMe(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

describe('changePassword', () => {
  beforeEach(() => {
    changePasswordSchema.validate = jest.fn().mockReturnValue({ value: { current_password: 'oldpass', new_password: 'newpass1' } });
  });

  it('returns 200 message on success', async () => {
    User.findById.mockResolvedValue({ email: 'a@b.com' });
    User.findByEmail.mockResolvedValue({ id: 'u1', email: 'a@b.com', password_hash: 'oldhash' });
    comparePassword.mockResolvedValue(true);
    hashPassword.mockResolvedValue('newhash');
    User.updatePassword.mockResolvedValue(true);
    const req = { user: { userId: 'u1' }, body: {} };
    const res = mockRes();
    await changePassword(req, res);
    expect(res.json).toHaveBeenCalledWith({ message: 'Password updated successfully' });
  });

  it('returns 400 when current password is wrong', async () => {
    User.findById.mockResolvedValue({ email: 'a@b.com' });
    User.findByEmail.mockResolvedValue({ id: 'u1', email: 'a@b.com', password_hash: 'oldhash' });
    comparePassword.mockResolvedValue(false);
    const req = { user: { userId: 'u1' }, body: {} };
    const res = mockRes();
    await changePassword(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 400 on validation error', async () => {
    changePasswordSchema.validate.mockReturnValue({ error: { details: [{ message: 'bad' }] } });
    const req = { user: { userId: 'u1' }, body: {} };
    const res = mockRes();
    await changePassword(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 500 on unexpected error', async () => {
    User.findById.mockRejectedValue(new Error('DB down'));
    const req = { user: { userId: 'u1' }, body: {} };
    const res = mockRes();
    await changePassword(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});
