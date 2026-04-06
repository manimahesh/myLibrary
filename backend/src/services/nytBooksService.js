const config = require('../config');

const NYT_BASE_URL = 'https://api.nytimes.com/svc/books/v3';

async function getTop10Books(listName = 'hardcover-fiction') {
  const url = `${NYT_BASE_URL}/lists/current/${listName}.json?api-key=${config.nytApiKey}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`NYT API error: ${response.status} ${response.statusText}`);
  }
  const data = await response.json();
  const books = data.results?.books || [];
  return books.slice(0, 10).map((book) => ({
    id: `isbn:${book.primary_isbn13}`,
    title: book.title,
    author: book.author,
    thumbnail: book.book_image || null,
    description: book.description || '',
    isbn13: book.primary_isbn13,
    rank: book.rank,
  }));
}

module.exports = { getTop10Books };
