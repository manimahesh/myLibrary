const config = require('../config');

const GOOGLE_BASE_URL = 'https://www.googleapis.com/books/v1';

async function searchBooks(query, maxResults = 12) {
  const params = new URLSearchParams({
    q: query,
    maxResults: String(maxResults),
    key: config.googleBooksApiKey,
  });

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch(`${GOOGLE_BASE_URL}/volumes?${params}`, {
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Google Books API error: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();
    return (data.items || []).map(normalizeVolume);
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new Error('Google Books API request timeout');
    }
    throw err;
  }
}

async function getBookDetails(bookId) {
  // Handle isbn: prefix — search by ISBN and return the first match
  if (bookId.startsWith('isbn:')) {
    const isbn = bookId.slice(5);
    const results = await searchBooks(`isbn:${isbn}`, 1);
    return results[0] || null;
  }

  const url = `${GOOGLE_BASE_URL}/volumes/${encodeURIComponent(bookId)}?key=${config.googleBooksApiKey}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch(url, {
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Google Books API error: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();
    return normalizeVolume(data);
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new Error('Google Books API request timeout');
    }
    throw err;
  }
}

function normalizeVolume(volume) {
  const info = volume.volumeInfo || {};
  const authors = info.authors || [];
  const thumbnail = info.imageLinks?.thumbnail || info.imageLinks?.smallThumbnail || null;

  return {
    id: volume.id,
    title: info.title || 'Unknown Title',
    authors,
    author: authors.join(', '),
    publishedDate: info.publishedDate || '',
    pageCount: info.pageCount || null,
    description: info.description || '',
    thumbnail: thumbnail ? thumbnail.replace('http://', 'https://') : null,
    averageRating: info.averageRating || null,
    ratingsCount: info.ratingsCount || 0,
    publisher: info.publisher || '',
    categories: info.categories || [],
  };
}

module.exports = { searchBooks, getBookDetails };