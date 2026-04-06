const config = require('../config');

const NYT_BASE_URL = 'https://api.nytimes.com/svc/books/v3';

async function getTop10Books(listName = 'hardcover-fiction') {
  const url = `${NYT_BASE_URL}/lists/current/${encodeURIComponent(listName)}.json?api-key=${config.nytApiKey}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch(url, {
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`NYT API error: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();
    const books = data.results?.books || [];
    return books.slice(0, 10).map((book, index) => ({
      id: book.primary_isbn13 ? `isbn:${book.primary_isbn13}` : `nyt-rank:${book.rank || index}`,
      title: book.title,
      author: book.author,
      thumbnail: book.book_image || null,
      description: book.description || '',
      isbn13: book.primary_isbn13 || null,
      rank: book.rank,
    }));
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new Error('NYT API request timeout');
    }
    throw err;
  }
}

module.exports = { getTop10Books };