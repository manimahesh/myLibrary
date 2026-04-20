jest.mock('../../config/database');
const db = require('../../config/database');
const Wishlist = require('../../models/Wishlist');

const userId = 'user-1';
const bookId = 'book-abc';
const itemId = 'item-1';

describe('Wishlist model', () => {
  beforeEach(() => jest.clearAllMocks());

  it('findAllByUser() returns rows ordered by created_at', async () => {
    const rows = [{ id: itemId, user_id: userId, book_id: bookId }];
    db.query.mockResolvedValue({ rows });
    const result = await Wishlist.findAllByUser(userId);
    expect(result).toEqual(rows);
    expect(db.query).toHaveBeenCalledWith(expect.stringContaining('ORDER BY'), [userId]);
  });

  it('findPageByUser() returns { items, total } using parallel queries', async () => {
    const rows = [{ id: itemId, user_id: userId, book_id: bookId }];
    db.query
      .mockResolvedValueOnce({ rows })
      .mockResolvedValueOnce({ rows: [{ count: '5' }] });

    const result = await Wishlist.findPageByUser(userId, 10, 0);
    expect(result).toEqual({ items: rows, total: 5 });
    expect(db.query).toHaveBeenCalledTimes(2);
  });

  it('findByBookId() returns the item when found', async () => {
    const row = { id: itemId };
    db.query.mockResolvedValue({ rows: [row] });
    const result = await Wishlist.findByBookId(userId, bookId);
    expect(result).toEqual(row);
  });

  it('findByBookId() returns null when not found', async () => {
    db.query.mockResolvedValue({ rows: [] });
    const result = await Wishlist.findByBookId(userId, 'no-book');
    expect(result).toBeNull();
  });

  it('create() inserts and returns the new item', async () => {
    const row = { id: itemId, user_id: userId, book_id: bookId };
    db.query.mockResolvedValue({ rows: [row] });
    const result = await Wishlist.create(userId, bookId);
    expect(db.query).toHaveBeenCalledWith(expect.stringContaining('INSERT'), [userId, bookId]);
    expect(result).toEqual(row);
  });

  it('updateRating() returns the updated item', async () => {
    const row = { id: itemId, rating: 4 };
    db.query.mockResolvedValue({ rows: [row] });
    const result = await Wishlist.updateRating(itemId, userId, 4);
    expect(result).toEqual(row);
  });

  it('updateRating() returns null when item not found', async () => {
    db.query.mockResolvedValue({ rows: [] });
    const result = await Wishlist.updateRating('bad-id', userId, 4);
    expect(result).toBeNull();
  });

  it('delete() returns true when row deleted', async () => {
    db.query.mockResolvedValue({ rowCount: 1 });
    const result = await Wishlist.delete(itemId, userId);
    expect(result).toBe(true);
  });

  it('delete() returns false when row not found', async () => {
    db.query.mockResolvedValue({ rowCount: 0 });
    const result = await Wishlist.delete('missing', userId);
    expect(result).toBe(false);
  });
});
