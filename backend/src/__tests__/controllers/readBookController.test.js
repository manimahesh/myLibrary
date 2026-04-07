jest.mock('../../models/ReadBook');
const ReadBook = require('../../models/ReadBook');
const { list, markAsRead, unmarkAsRead } = require('../../controllers/readBookController');

function mockReq(overrides = {}) {
  return { user: { userId: 'user-1' }, body: {}, params: {}, ...overrides };
}
function mockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe('list', () => {
  it('returns all read books', async () => {
    const items = [{ id: 'r1' }];
    ReadBook.findAllByUser.mockResolvedValue(items);
    const res = mockRes();
    await list(mockReq(), res);
    expect(res.json).toHaveBeenCalledWith({ readBooks: items });
  });

  it('returns 500 on error', async () => {
    ReadBook.findAllByUser.mockRejectedValue(new Error('DB error'));
    const res = mockRes();
    await list(mockReq(), res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

describe('markAsRead', () => {
  it('returns 400 for missing book_id', async () => {
    const res = mockRes();
    await markAsRead(mockReq({ body: {} }), res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 409 when already marked as read', async () => {
    ReadBook.findByBookId.mockResolvedValue({ id: 'r1' });
    const res = mockRes();
    await markAsRead(mockReq({ body: { book_id: 'book-1' } }), res);
    expect(res.status).toHaveBeenCalledWith(409);
  });

  it('returns 201 on successful mark', async () => {
    ReadBook.findByBookId.mockResolvedValue(null);
    ReadBook.create.mockResolvedValue({ id: 'r1', book_id: 'book-1' });
    const res = mockRes();
    await markAsRead(mockReq({ body: { book_id: 'book-1' } }), res);
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('accepts optional read_at date', async () => {
    ReadBook.findByBookId.mockResolvedValue(null);
    ReadBook.create.mockResolvedValue({ id: 'r1' });
    const res = mockRes();
    await markAsRead(mockReq({ body: { book_id: 'book-1', read_at: '2024-06-01' } }), res);
    expect(ReadBook.create).toHaveBeenCalledWith('user-1', 'book-1', '2024-06-01');
  });
});

describe('unmarkAsRead', () => {
  const validId = '550e8400-e29b-41d4-a716-446655440000';

  it('returns 400 for invalid UUID', async () => {
    const res = mockRes();
    await unmarkAsRead(mockReq({ params: { id: 'not-uuid' } }), res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 404 when record not found', async () => {
    ReadBook.delete.mockResolvedValue(false);
    const res = mockRes();
    await unmarkAsRead(mockReq({ params: { id: validId } }), res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('returns success message when deleted', async () => {
    ReadBook.delete.mockResolvedValue(true);
    const res = mockRes();
    await unmarkAsRead(mockReq({ params: { id: validId } }), res);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.any(String) }));
  });
});
