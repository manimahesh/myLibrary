const nytBooksService = require('../services/nytBooksService');
const googleBooksService = require('../services/googleBooksService');

async function getNytTop(req, res) {
  try {
    const books = await nytBooksService.getTop10Books();
    res.json({ books });
  } catch (err) {
    console.error('NYT top books error:', err);
    res.status(500).json({ error: 'Failed to fetch NYT bestsellers' });
  }
}

async function googleSearch(req, res) {
  try {
    const { q } = req.query;
    if (!q || !q.trim()) {
      return res.status(400).json({ error: 'Query parameter q is required' });
    }
    const books = await googleBooksService.searchBooks(q.trim());
    res.json({ books });
  } catch (err) {
    console.error('Google Books search error:', err);
    res.status(500).json({ error: 'Failed to search books' });
  }
}

async function getBookDetail(req, res) {
  try {
    const book = await googleBooksService.getBookDetails(req.params.id);
    if (!book) {
      return res.status(404).json({ error: 'Book not found' });
    }
    res.json({ book });
  } catch (err) {
    console.error('Book detail error:', err);
    res.status(500).json({ error: 'Failed to fetch book details' });
  }
}

module.exports = { getNytTop, googleSearch, getBookDetail };
