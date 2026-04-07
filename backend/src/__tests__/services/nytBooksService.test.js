const { getTop10Books } = require('../../services/nytBooksService');

const mockBooks = Array.from({ length: 3 }, (_, i) => ({
  primary_isbn13: `978000000000${i}`,
  title: `Book ${i}`,
  author: `Author ${i}`,
  book_image: `https://example.com/img${i}.jpg`,
  description: `Desc ${i}`,
  rank: i + 1,
}));

describe('nytBooksService.getTop10Books', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  it('returns normalized books on success', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ results: { books: mockBooks } }),
    });

    const books = await getTop10Books();
    expect(books).toHaveLength(3);
    expect(books[0]).toMatchObject({
      id: `isbn:9780000000000`,
      title: 'Book 0',
      author: 'Author 0',
    });
  });

  it('uses nyt-rank id when isbn13 is missing', async () => {
    const booksNoIsbn = [{ title: 'No ISBN', author: 'A', rank: 5 }];
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ results: { books: booksNoIsbn } }),
    });

    const books = await getTop10Books();
    expect(books[0].id).toBe('nyt-rank:5');
  });

  it('throws when API returns non-ok response', async () => {
    global.fetch.mockResolvedValue({ ok: false, status: 429, statusText: 'Too Many Requests' });
    await expect(getTop10Books()).rejects.toThrow('NYT API error');
  });

  it('throws timeout error when fetch is aborted', async () => {
    global.fetch.mockRejectedValue(Object.assign(new Error('aborted'), { name: 'AbortError' }));
    await expect(getTop10Books()).rejects.toThrow('timeout');
  });
});
