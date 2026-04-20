const config = require('../config');
const Book = require('../models/Book');

const GOOGLE_BASE_URL = 'https://www.googleapis.com/books/v1';

// In-memory cache: bookId → { data, expiresAt }
const cache = new Map();
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

function cacheGet(key) {
  const entry = cache.get(key);
  if (!entry) return undefined;
  if (Date.now() > entry.expiresAt) { cache.delete(key); return undefined; }
  return entry.data;
}

function cacheSet(key, data) {
  cache.set(key, { data, expiresAt: Date.now() + CACHE_TTL_MS });
}

// In-flight deduplication: if the same bookId is requested concurrently, share one promise
const inFlight = new Map();

// Sequential queue with 200 ms gap to stay under Google's rate limit
let googleQueue = Promise.resolve();
function enqueueGoogleRequest(fn) {
  const result = googleQueue.then(fn);
  googleQueue = result
    .then(() => new Promise(r => setTimeout(r, 200)))
    .catch(() => new Promise(r => setTimeout(r, 200)));
  return result;
}

async function fetchWithRetry(fetchFn, retries = 3, baseDelayMs = 2000) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fetchFn();
    } catch (err) {
      const is429 = err.status === 429;
      if (is429 && attempt < retries) {
        await new Promise(r => setTimeout(r, baseDelayMs * (attempt + 1)));
        continue;
      }
      throw err;
    }
  }
}

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
      const err = new Error(`Google Books API error: ${response.status} ${response.statusText}`);
      err.status = response.status;
      throw err;
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
  // 1. In-memory cache hit
  const cached = cacheGet(bookId);
  if (cached !== undefined) return cached;

  // 2. DB cache hit — avoids Google API call across server restarts
  try {
    const dbRow = await Book.findById(bookId);
    if (dbRow) {
      const book = dbRowToBook(dbRow);
      cacheSet(bookId, book);
      return book;
    }
  } catch {
    // DB unavailable — fall through to Google API
  }

  // 3. Deduplicate concurrent requests for the same bookId
  if (inFlight.has(bookId)) return inFlight.get(bookId);

  const promise = enqueueGoogleRequest(async () => {
    // Re-check in-memory cache in case a previous queued request already filled it
    const hot = cacheGet(bookId);
    if (hot !== undefined) return hot;

    let book;
    if (bookId.startsWith('isbn:')) {
      const isbn = bookId.slice(5);
      book = await fetchWithRetry(async () => {
        const results = await searchBooks(`isbn:${isbn}`, 1);
        if (!results[0]) return null;
        return { ...results[0], id: bookId };
      });
    } else {
      const url = `${GOOGLE_BASE_URL}/volumes/${encodeURIComponent(bookId)}?key=${config.googleBooksApiKey}`;
      book = await fetchWithRetry(async () => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        try {
          const response = await fetch(url, { signal: controller.signal });
          clearTimeout(timeoutId);
          if (!response.ok) {
            const err = new Error(`Google Books API error: ${response.status} ${response.statusText}`);
            err.status = response.status;
            throw err;
          }
          return normalizeVolume(await response.json());
        } catch (err) {
          clearTimeout(timeoutId);
          if (err.name === 'AbortError') throw new Error('Google Books API request timeout');
          throw err;
        }
      });
    }

    cacheSet(bookId, book);

    // Write through to DB cache (fire-and-forget)
    if (book) {
      Book.upsert({
        book_id:        bookId,
        title:          book.title,
        author:         book.author,
        thumbnail:      book.thumbnail,
        description:    book.description,
        published_date: book.publishedDate,
        page_count:     book.pageCount,
        average_rating: book.averageRating,
        ratings_count:  book.ratingsCount,
        publisher:      book.publisher,
        categories:     book.categories,
      }).catch(() => {});
    }

    return book;
  }).finally(() => inFlight.delete(bookId));

  inFlight.set(bookId, promise);
  return promise;
}

function dbRowToBook(row) {
  return {
    id:            row.book_id,
    title:         row.title,
    author:        row.author,
    authors:       row.author ? row.author.split(', ') : [],
    thumbnail:     row.thumbnail,
    description:   row.description,
    publishedDate: row.published_date,
    pageCount:     row.page_count,
    averageRating: row.average_rating != null ? Number(row.average_rating) : null,
    ratingsCount:  row.ratings_count,
    publisher:     row.publisher,
    categories:    row.categories ? row.categories.split(', ') : [],
  };
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