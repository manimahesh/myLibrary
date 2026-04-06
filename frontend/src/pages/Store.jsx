import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import BookCard from '../components/BookCard';
import api from '../services/api';

function IconBook() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  );
}

function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const initial = user?.email?.[0]?.toUpperCase() ?? '?';

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <div className="navbar-brand-logo"><IconBook /></div>
        <span className="navbar-brand-name">MyLibrary</span>
      </div>
      <div className="navbar-nav">
        <Link to="/store" className={`navbar-nav-link${location.pathname === '/store' ? ' active' : ''}`}>Browse</Link>
        <Link to="/wishlist" className={`navbar-nav-link${location.pathname === '/wishlist' ? ' active' : ''}`}>Wishlist</Link>
        <Link to="/profile" className={`navbar-nav-link${location.pathname === '/profile' ? ' active' : ''}`}>Profile</Link>
      </div>
      <div className="navbar-user">
        {user && <span className="navbar-email">{user.email}</span>}
        <div className="navbar-avatar">{initial}</div>
        <button className="btn btn-secondary btn-sm" onClick={logout}>Sign out</button>
      </div>
    </nav>
  );
}

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

  // Pre-fetch wishlist so BookCards can reflect existing state immediately
  useEffect(() => {
    api.get('/wishlist')
      .then(res => setWishlistIds(new Set(res.data.wishlist.map(i => i.book_id))))
      .catch(() => {});
  }, []);

  function handleAddedToWishlist(bookId) {
    setWishlistIds(prev => new Set([...prev, bookId]));
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
    <>
      <Navbar />
      <div className="store-content">

        {/* Search */}
        <div className="store-section">
          <div className="store-section-title">Search Books</div>
          <div className="store-section-sub">Find any book in the Google Books catalog</div>
          <form className="store-search" onSubmit={handleSearch}>
            <input
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
                <BookCard key={book.id} book={book} inWishlist={wishlistIds.has(book.id)} onAdded={handleAddedToWishlist} />
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
                <BookCard key={book.id} book={book} inWishlist={wishlistIds.has(book.id)} onAdded={handleAddedToWishlist} />
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
                <BookCard key={book.id} book={book} inWishlist={wishlistIds.has(book.id)} onAdded={handleAddedToWishlist} />
              ))}
            </div>
          ) : !curatedError && (
            <div className="empty-state">
              <p>No curated books available.</p>
            </div>
          )}
        </div>

      </div>
    </>
  );
}
