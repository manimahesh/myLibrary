jest.mock('../../config/database');
const db = require('../../config/database');
const BookSummary = require('../../models/BookSummary');

const userId = 'user-1';
const bookId = 'book-abc';
const summaryId = 'sum-1';

describe('BookSummary model', () => {
  beforeEach(() => jest.clearAllMocks());

  it('findByUserAndBook() returns summary when found', async () => {
    const row = { id: summaryId, user_id: userId, book_id: bookId };
    db.query.mockResolvedValue({ rows: [row] });
    const result = await BookSummary.findByUserAndBook(userId, bookId);
    expect(result).toEqual(row);
  });

  it('findByUserAndBook() returns null when not found', async () => {
    db.query.mockResolvedValue({ rows: [] });
    const result = await BookSummary.findByUserAndBook(userId, 'no-book');
    expect(result).toBeNull();
  });

  it('create() inserts and returns the new summary', async () => {
    const row = { id: summaryId };
    db.query.mockResolvedValue({ rows: [row] });
    const result = await BookSummary.create(userId, bookId, 'My notes');
    expect(db.query).toHaveBeenCalledWith(expect.stringContaining('INSERT'), [userId, bookId, 'My notes']);
    expect(result).toEqual(row);
  });

  it('update() returns the updated summary', async () => {
    const row = { id: summaryId, summary_text: 'Updated' };
    db.query.mockResolvedValue({ rows: [row] });
    const result = await BookSummary.update(summaryId, userId, 'Updated');
    expect(result).toEqual(row);
  });

  it('delete() returns true when deleted', async () => {
    db.query.mockResolvedValue({ rowCount: 1 });
    expect(await BookSummary.delete(summaryId, userId)).toBe(true);
  });

  it('delete() returns false when not found', async () => {
    db.query.mockResolvedValue({ rowCount: 0 });
    expect(await BookSummary.delete('missing', userId)).toBe(false);
  });
});
