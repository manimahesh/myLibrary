import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import BookCard from '../components/BookCard';
import api from '../services/api';

export default function Store() {
  const [nytBooks, setNytBooks] = useState([]);
  const [curatedBooks, setCuratedBooks] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [nytLoading, setNytLoading] = useState(true);
  const [curatedLoading, setCuratedLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [nytError, setNytError] = useState('');
  const [curatedError, setCuratedError] = useState('');
  const [searchError, setSearchError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [wishlistIds, setWishlistIds] = useState(new Set());
  // Map<book_id, read_book_id>
  const [readBooksMap, setReadBooksMap] = useState(new Map());
  const [searchParams] = useSearchParams();
  const searchInputRef = useRef(null);

  // Focus search input when ?focus=search is in the URL
  useEffect(() => {
    if (searchParams.get('focus') === 'search' && searchInputRef.current) {
      searchInputRef.current.focus();
      searchInputRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [searchParams]);

  // Pre-fetch wishlist and read books so BookCards reflect existing state immediately
  useEffect(() => {
    api.get('/wishlist')
      .then(res => setWishlistIds(new Set(res.data.wishlist.map(i => i.book_id))))
      .catch(() => {});
    api.get('/read-books')
      .then(res => setReadBooksMap(new Map(res.data.readBooks.map(i => [i.book_id, i.id]))))
      .catch(() => {});
  }, []);

  function handleAddedToWishlist(bookId) {
    setWishlistIds(prev => new Set([...prev, bookId]));
  }

  function handleReadToggle(bookId, newReadBookId) {
    setReadBooksMap(prev => {
      const next = new Map(prev);
      if (newReadBookId) {
        next.set(bookId, newReadBookId);
      } else {
        next.delete(bookId);
      }
      return next;
    });
  }

  useEffect(() => {
    const controller = new AbortController();

    async function loadNytTop() {
      try {
        const res = await api.get('/books/nyt-top', { signal: controller.signal });
        setNytBooks(res.data.books);
      } catch (err) {
        if (err.name === 'CanceledError' || err.name === 'AbortError') return;
        setNytError('Failed to load NYT bestsellers. Check your NYT API key.');
      } finally {
        setNytLoading(false);
      }
    }

    async function loadCurated() {
      try {
        const res = await api.get('/books/google-search', { params: { q: 'popular fiction 2024' }, signal: controller.signal });
        setCuratedBooks(res.data.books);
      } catch (err) {
        if (err.name === 'CanceledError' || err.name === 'AbortError') return;
        setCuratedError('Failed to load curated books.');
      } finally {
        setCuratedLoading(false);
      }
    }

    loadNytTop();
    loadCurated();
    return () => controller.abort();
  }, []);

  async function handleSearch(e) {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setSearchLoading(true);
    setSearchError('');
    setSearchResults([]);
    try {
      const res = await api.get('/books/google-search', { params: { q: searchQuery.trim() } });
      setSearchResults(res.data.books);
    } catch {
      setSearchError('Search failed. Please try again.');
    } finally {
      setSearchLoading(false);
    }
  }

  return (
    <div className="store-content">

      {/* Search */}
      <div className="store-section">
        <div className="store-section-title">Search Books</div>
        <div className="store-section-sub">Find any book in the Google Books catalog</div>
        <form className="store-search" onSubmit={handleSearch}>
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search by title, author, or ISBN..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button className="btn btn-primary btn-sm" type="submit" disabled={searchLoading} style={{ width: 'auto' }}>
            {searchLoading ? 'Searching...' : 'Search'}
          </button>
        </form>
        {searchError && <p className="server-error">{searchError}</p>}
        {searchResults.length > 0 && (
          <div className="books-grid">
            {searchResults.map((book) => (
              <BookCard
                key={book.id}
                book={book}
                inWishlist={wishlistIds.has(book.id)}
                onAdded={handleAddedToWishlist}
                inReadBooks={readBooksMap.has(book.id)}
                readBookId={readBooksMap.get(book.id) ?? null}
                onReadToggle={handleReadToggle}
              />
            ))}
          </div>
        )}
      </div>

      {/* NYT Top 10 */}
      <div className="store-section">
        <div className="store-section-title">NYT Bestsellers</div>
        <div className="store-section-sub">Hardcover fiction — this week's top 10</div>
        {nytError && <p className="server-error">{nytError}</p>}
        {nytLoading ? (
          <p style={{ color: 'var(--color-text-3)', fontSize: 14 }}>Loading...</p>
        ) : nytBooks.length > 0 ? (
          <div className="books-grid">
            {nytBooks.map((book) => (
              <BookCard
                key={book.id}
                book={book}
                inWishlist={wishlistIds.has(book.id)}
                onAdded={handleAddedToWishlist}
                inReadBooks={readBooksMap.has(book.id)}
                readBookId={readBooksMap.get(book.id) ?? null}
                onReadToggle={handleReadToggle}
              />
            ))}
          </div>
        ) : !nytError && (
          <div className="empty-state">
            <p>No bestsellers available.</p>
          </div>
        )}
      </div>

      {/* Curated Google Books */}
      <div className="store-section">
        <div className="store-section-title">Curated Picks</div>
        <div className="store-section-sub">Popular fiction titles from Google Books</div>
        {curatedError && <p className="server-error">{curatedError}</p>}
        {curatedLoading ? (
          <p style={{ color: 'var(--color-text-3)', fontSize: 14 }}>Loading...</p>
        ) : curatedBooks.length > 0 ? (
          <div className="books-grid">
            {curatedBooks.map((book) => (
              <BookCard
                key={book.id}
                book={book}
                inWishlist={wishlistIds.has(book.id)}
                onAdded={handleAddedToWishlist}
                inReadBooks={readBooksMap.has(book.id)}
                readBookId={readBooksMap.get(book.id) ?? null}
                onReadToggle={handleReadToggle}
              />
            ))}
          </div>
        ) : !curatedError && (
          <div className="empty-state">
            <p>No curated books available.</p>
          </div>
        )}
      </div>

    </div>
  );
}
