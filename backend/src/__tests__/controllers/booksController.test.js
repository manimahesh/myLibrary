jest.mock('../../services/nytBooksService');
jest.mock('../../services/googleBooksService');
const nytBooksService = require('../../services/nytBooksService');
const googleBooksService = require('../../services/googleBooksService');
const { getNytTop, googleSearch, getBookDetail } = require('../../controllers/booksController');

function mockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe('getNytTop', () => {
  it('returns books on success', async () => {
    const books = [{ id: 'isbn:123', title: 'Book A' }];
    nytBooksService.getTop10Books.mockResolvedValue(books);
    const res = mockRes();
    await getNytTop({}, res);
    expect(res.json).toHaveBeenCalledWith({ books });
  });

  it('returns 500 on service error', async () => {
    nytBooksService.getTop10Books.mockRejectedValue(new Error('API down'));
    const res = mockRes();
    await getNytTop({}, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

describe('googleSearch', () => {
  it('returns 400 when q is missing', async () => {
    const req = { query: {} };
    const res = mockRes();
    await googleSearch(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns books on success', async () => {
    const books = [{ id: 'vol1', title: 'Book B' }];
    googleBooksService.searchBooks.mockResolvedValue(books);
    const req = { query: { q: 'fiction' } };
    const res = mockRes();
    await googleSearch(req, res);
    expect(res.json).toHaveBeenCalledWith({ books });
  });

  it('returns 500 on service error', async () => {
    googleBooksService.searchBooks.mockRejectedValue(new Error('API down'));
    const req = { query: { q: 'fiction' } };
    const res = mockRes();
    await googleSearch(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

describe('getBookDetail', () => {
  it('returns book on success', async () => {
    const book = { id: 'vol1', title: 'Book C' };
    googleBooksService.getBookDetails.mockResolvedValue(book);
    const req = { params: { id: 'vol1' } };
    const res = mockRes();
    await getBookDetail(req, res);
    expect(res.json).toHaveBeenCalledWith({ book });
  });

  it('returns 404 when book not found', async () => {
    googleBooksService.getBookDetails.mockResolvedValue(null);
    const req = { params: { id: 'missing' } };
    const res = mockRes();
    await getBookDetail(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });
});
