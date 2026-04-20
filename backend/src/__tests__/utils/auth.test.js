const { hashPassword, comparePassword, generateToken, verifyToken, registerSchema, loginSchema, updateProfileSchema, changePasswordSchema } = require('../../utils/auth');

describe('hashPassword / comparePassword', () => {
  it('hashes a password and verifies it correctly', async () => {
    const hash = await hashPassword('MySecret123');
    expect(hash).not.toBe('MySecret123');
    const match = await comparePassword('MySecret123', hash);
    expect(match).toBe(true);
  });

  it('returns false for a wrong password', async () => {
    const hash = await hashPassword('MySecret123');
    const match = await comparePassword('WrongPassword', hash);
    expect(match).toBe(false);
  });
});

describe('generateToken / verifyToken', () => {
  it('generates a token and verifies the userId payload', () => {
    const userId = 'test-user-id';
    const token = generateToken(userId);
    expect(typeof token).toBe('string');
    const payload = verifyToken(token);
    expect(payload.userId).toBe(userId);
  });

  it('throws on an invalid token', () => {
    expect(() => verifyToken('not.a.valid.token')).toThrow();
  });
});

describe('registerSchema', () => {
  it('accepts valid email and password', () => {
    const { error } = registerSchema.validate({ email: 'user@example.com', password: 'password123' });
    expect(error).toBeUndefined();
  });

  it('rejects a missing password', () => {
    const { error } = registerSchema.validate({ email: 'user@example.com' });
    expect(error).toBeDefined();
  });

  it('rejects a password shorter than 8 chars', () => {
    const { error } = registerSchema.validate({ email: 'user@example.com', password: 'short' });
    expect(error).toBeDefined();
  });

  it('rejects an invalid email', () => {
    const { error } = registerSchema.validate({ email: 'not-an-email', password: 'password123' });
    expect(error).toBeDefined();
  });
});

describe('loginSchema', () => {
  it('accepts valid credentials', () => {
    const { error } = loginSchema.validate({ email: 'user@example.com', password: 'anypassword' });
    expect(error).toBeUndefined();
  });

  it('rejects missing password', () => {
    const { error } = loginSchema.validate({ email: 'user@example.com' });
    expect(error).toBeDefined();
  });
});

describe('updateProfileSchema', () => {
  it('accepts first_name and last_name', () => {
    const { error } = updateProfileSchema.validate({ first_name: 'Jane', last_name: 'Smith' });
    expect(error).toBeUndefined();
  });

  it('accepts empty strings', () => {
    const { error } = updateProfileSchema.validate({ first_name: '', last_name: '' });
    expect(error).toBeUndefined();
  });

  it('accepts an empty object (both optional)', () => {
    const { error } = updateProfileSchema.validate({});
    expect(error).toBeUndefined();
  });

  it('rejects first_name longer than 100 chars', () => {
    const { error } = updateProfileSchema.validate({ first_name: 'A'.repeat(101) });
    expect(error).toBeDefined();
  });
});

describe('changePasswordSchema', () => {
  it('accepts valid current and new passwords', () => {
    const { error } = changePasswordSchema.validate({ current_password: 'oldpass1', new_password: 'newpass1' });
    expect(error).toBeUndefined();
  });

  it('rejects missing current_password', () => {
    const { error } = changePasswordSchema.validate({ new_password: 'newpass1' });
    expect(error).toBeDefined();
  });

  it('rejects new_password shorter than 8 chars', () => {
    const { error } = changePasswordSchema.validate({ current_password: 'oldpass1', new_password: 'short' });
    expect(error).toBeDefined();
  });
});
