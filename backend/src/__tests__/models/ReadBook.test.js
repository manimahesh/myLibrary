jest.mock('../../config/database');
const db = require('../../config/database');
const ReadBook = require('../../models/ReadBook');

const userId = 'user-1';
const bookId = 'book-abc';
const recordId = 'rec-1';

describe('ReadBook model', () => {
  beforeEach(() => jest.clearAllMocks());

  it('findAllByUser() returns rows ordered by read_at DESC', async () => {
    const rows = [{ id: recordId, user_id: userId, book_id: bookId }];
    db.query.mockResolvedValue({ rows });
    const result = await ReadBook.findAllByUser(userId);
    expect(result).toEqual(rows);
    expect(db.query).toHaveBeenCalledWith(expect.stringContaining('ORDER BY read_at DESC'), [userId]);
  });

  it('findByBookId() returns the record when found', async () => {
    const row = { id: recordId };
    db.query.mockResolvedValue({ rows: [row] });
    const result = await ReadBook.findByBookId(userId, bookId);
    expect(result).toEqual(row);
  });

  it('findByBookId() returns null when not found', async () => {
    db.query.mockResolvedValue({ rows: [] });
    const result = await ReadBook.findByBookId(userId, 'no-book');
    expect(result).toBeNull();
  });

  it('create() inserts with provided read_at', async () => {
    const row = { id: recordId, user_id: userId, book_id: bookId, read_at: '2024-01-01' };
    db.query.mockResolvedValue({ rows: [row] });
    const result = await ReadBook.create(userId, bookId, '2024-01-01');
    expect(db.query).toHaveBeenCalledWith(expect.stringContaining('INSERT'), [userId, bookId, '2024-01-01']);
    expect(result).toEqual(row);
  });

  it('create() uses current date when read_at is omitted', async () => {
    const row = { id: recordId };
    db.query.mockResolvedValue({ rows: [row] });
    await ReadBook.create(userId, bookId);
    const callArgs = db.query.mock.calls[0][1];
    expect(callArgs[2]).toBeInstanceOf(Date);
  });

  it('delete() returns true when row deleted', async () => {
    db.query.mockResolvedValue({ rowCount: 1 });
    const result = await ReadBook.delete(recordId, userId);
    expect(result).toBe(true);
  });

  it('delete() returns false when row not found', async () => {
    db.query.mockResolvedValue({ rowCount: 0 });
    const result = await ReadBook.delete('missing', userId);
    expect(result).toBe(false);
  });
});
