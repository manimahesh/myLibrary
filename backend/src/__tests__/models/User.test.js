jest.mock('../../config/database');
const db = require('../../config/database');
const User = require('../../models/User');

describe('User model', () => {
  beforeEach(() => jest.clearAllMocks());

  it('create() inserts and returns the new user', async () => {
    const row = { id: 'uuid-1', email: 'a@b.com', created_at: new Date(), updated_at: new Date() };
    db.query.mockResolvedValue({ rows: [row] });

    const result = await User.create('a@b.com', 'hash');
    expect(db.query).toHaveBeenCalledWith(expect.stringContaining('INSERT'), ['a@b.com', 'hash']);
    expect(result).toEqual(row);
  });

  it('findByEmail() returns the user when found', async () => {
    const row = { id: 'uuid-1', email: 'a@b.com', password_hash: 'hash' };
    db.query.mockResolvedValue({ rows: [row] });

    const result = await User.findByEmail('a@b.com');
    expect(result).toEqual(row);
  });

  it('findByEmail() returns null when not found', async () => {
    db.query.mockResolvedValue({ rows: [] });
    const result = await User.findByEmail('missing@b.com');
    expect(result).toBeNull();
  });

  it('findById() returns the user when found', async () => {
    const row = { id: 'uuid-1', email: 'a@b.com' };
    db.query.mockResolvedValue({ rows: [row] });
    const result = await User.findById('uuid-1');
    expect(result).toEqual(row);
  });

  it('findById() returns null when not found', async () => {
    db.query.mockResolvedValue({ rows: [] });
    const result = await User.findById('no-such-id');
    expect(result).toBeNull();
  });
});
