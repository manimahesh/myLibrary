const { searchBooks, getBookDetails } = require('../../services/googleBooksService');

const mockVolume = {
  id: 'vol123',
  volumeInfo: {
    title: 'Test Book',
    authors: ['Author One'],
    publishedDate: '2023-01-01',
    pageCount: 300,
    description: 'A great book',
    imageLinks: { thumbnail: 'https://example.com/thumb.jpg' },
    averageRating: 4.2,
    ratingsCount: 120,
    publisher: 'Test Publisher',
    categories: ['Fiction'],
  },
};

describe('googleBooksService.searchBooks', () => {
  beforeEach(() => { global.fetch = jest.fn(); });

  it('returns normalized volumes on success', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ items: [mockVolume] }),
    });

    const books = await searchBooks('test');
    expect(books).toHaveLength(1);
    expect(books[0]).toMatchObject({ id: 'vol123', title: 'Test Book', author: 'Author One' });
  });

  it('returns empty array when no items', async () => {
    global.fetch.mockResolvedValue({ ok: true, json: async () => ({}) });
    const books = await searchBooks('empty query');
    expect(books).toEqual([]);
  });

  it('throws on non-ok response', async () => {
    global.fetch.mockResolvedValue({ ok: false, status: 403, statusText: 'Forbidden' });
    await expect(searchBooks('test')).rejects.toThrow('Google Books API error');
  });
});

describe('googleBooksService.getBookDetails', () => {
  beforeEach(() => { global.fetch = jest.fn(); });

  it('returns normalized book for a Google volume ID', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => mockVolume,
    });

    const book = await getBookDetails('vol123');
    expect(book).toMatchObject({ id: 'vol123', title: 'Test Book' });
  });

  it('searches by ISBN when id starts with "isbn:"', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ items: [mockVolume] }),
    });

    const book = await getBookDetails('isbn:9780000000001');
    expect(book).toMatchObject({ title: 'Test Book' });
    expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('isbn:'), expect.any(Object));
  });
});
