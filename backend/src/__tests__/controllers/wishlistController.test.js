jest.mock('../../models/Wishlist');
const Wishlist = require('../../models/Wishlist');
const { list, add, updateRating, remove } = require('../../controllers/wishlistController');

function mockReq(overrides = {}) {
  return { user: { userId: 'user-1' }, body: {}, params: {}, query: {}, ...overrides };
}
function mockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe('list', () => {
  it('returns all wishlist items', async () => {
    Wishlist.findPageByUser.mockResolvedValue({ items: [{ id: 'i1' }], total: 1 });
    const res = mockRes();
    await list(mockReq(), res);
    expect(res.json).toHaveBeenCalledWith({ wishlist: [{ id: 'i1' }], total: 1, limit: 10, offset: 0 });
  });

  it('returns 500 on error', async () => {
    Wishlist.findPageByUser.mockRejectedValue(new Error('DB error'));
    const res = mockRes();
    await list(mockReq(), res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

describe('add', () => {
  it('returns 400 for invalid body', async () => {
    const res = mockRes();
    await add(mockReq({ body: {} }), res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 409 when book already in wishlist', async () => {
    Wishlist.findByBookId.mockResolvedValue({ id: 'existing' });
    const res = mockRes();
    await add(mockReq({ body: { book_id: 'book-1' } }), res);
    expect(res.status).toHaveBeenCalledWith(409);
  });

  it('returns 201 on successful add', async () => {
    Wishlist.findByBookId.mockResolvedValue(null);
    Wishlist.create.mockResolvedValue({ id: 'new-item', book_id: 'book-1' });
    const res = mockRes();
    await add(mockReq({ body: { book_id: 'book-1' } }), res);
    expect(res.status).toHaveBeenCalledWith(201);
  });
});

describe('updateRating', () => {
  const validId = '550e8400-e29b-41d4-a716-446655440000';

  it('returns 400 for invalid UUID', async () => {
    const res = mockRes();
    await updateRating(mockReq({ params: { id: 'not-a-uuid' }, body: { rating: 3 } }), res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 400 for invalid rating', async () => {
    const res = mockRes();
    await updateRating(mockReq({ params: { id: validId }, body: { rating: 6 } }), res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 404 when item not found', async () => {
    Wishlist.updateRating.mockResolvedValue(null);
    const res = mockRes();
    await updateRating(mockReq({ params: { id: validId }, body: { rating: 4 } }), res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('returns updated item on success', async () => {
    const item = { id: validId, rating: 4 };
    Wishlist.updateRating.mockResolvedValue(item);
    const res = mockRes();
    await updateRating(mockReq({ params: { id: validId }, body: { rating: 4 } }), res);
    expect(res.json).toHaveBeenCalledWith({ item });
  });
});

describe('remove', () => {
  const validId = '550e8400-e29b-41d4-a716-446655440000';

  it('returns 400 for invalid UUID', async () => {
    const res = mockRes();
    await remove(mockReq({ params: { id: 'bad' } }), res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 404 when item not found', async () => {
    Wishlist.delete.mockResolvedValue(false);
    const res = mockRes();
    await remove(mockReq({ params: { id: validId } }), res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('returns success message when deleted', async () => {
    Wishlist.delete.mockResolvedValue(true);
    const res = mockRes();
    await remove(mockReq({ params: { id: validId } }), res);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.any(String) }));
  });
});
