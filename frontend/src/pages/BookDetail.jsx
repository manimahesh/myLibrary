import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

function IconBook() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  );
}

function StarDisplay({ rating, count }) {
  return (
    <div className="book-detail-rating">
      <div className="stars-display">
        {[1, 2, 3, 4, 5].map((star) => (
          <span key={star} className={star <= Math.round(rating) ? 'star-filled' : 'star-empty'}>★</span>
        ))}
      </div>
      {rating && <span className="rating-count">{rating.toFixed(1)} ({count} ratings)</span>}
    </div>
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

export default function BookDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const [wishlistError, setWishlistError] = useState('');

  useEffect(() => {
    loadBook();
  }, [id]);

  async function loadBook() {
    setLoading(true);
    setError('');
    try {
      const res = await api.get(`/books/${encodeURIComponent(id)}`);
      setBook(res.data.book);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load book details.');
    } finally {
      setLoading(false);
    }
  }

  async function handleAddToWishlist() {
    setAdding(true);
    setWishlistError('');
    try {
      await api.post('/wishlist', { book_id: id });
      setAdded(true);
    } catch (err) {
      if (err.response?.status === 409) {
        setAdded(true);
      } else {
        setWishlistError(err.response?.data?.error || 'Failed to add to wishlist.');
      }
    } finally {
      setAdding(false);
    }
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="book-detail-content">
          <p style={{ color: 'var(--color-text-3)', fontSize: 14 }}>Loading book details...</p>
        </div>
      </>
    );
  }

  if (error || !book) {
    return (
      <>
        <Navbar />
        <div className="book-detail-content">
          <button className="book-detail-back" onClick={() => navigate(-1)}>← Back</button>
          <p className="server-error">{error || 'Book not found.'}</p>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="book-detail-content">
        <button className="book-detail-back" onClick={() => navigate(-1)}>← Back</button>

        <div className="book-detail-hero">
          {book.thumbnail ? (
            <img src={book.thumbnail} alt={book.title} className="book-detail-cover" />
          ) : (
            <div className="book-detail-cover-placeholder">No cover</div>
          )}

          <div className="book-detail-meta">
            <h1 className="book-detail-title">{book.title}</h1>
            {book.author && <p className="book-detail-author">by {book.author}</p>}

            <div className="book-detail-stats">
              {book.publishedDate && (
                <div className="book-detail-stat">
                  <span className="book-detail-stat-label">Published</span>
                  <span className="book-detail-stat-value">{book.publishedDate}</span>
                </div>
              )}
              {book.pageCount && (
                <div className="book-detail-stat">
                  <span className="book-detail-stat-label">Pages</span>
                  <span className="book-detail-stat-value">{book.pageCount}</span>
                </div>
              )}
              {book.publisher && (
                <div className="book-detail-stat">
                  <span className="book-detail-stat-label">Publisher</span>
                  <span className="book-detail-stat-value">{book.publisher}</span>
                </div>
              )}
            </div>

            {book.averageRating && (
              <StarDisplay rating={book.averageRating} count={book.ratingsCount} />
            )}

            <div className="book-detail-actions">
              <button
                className="btn btn-primary"
                style={{ width: 'auto' }}
                onClick={handleAddToWishlist}
                disabled={adding || added}
              >
                {added ? 'In Wishlist' : adding ? 'Adding...' : '+ Add to Wishlist'}
              </button>
              <button className="btn btn-secondary" style={{ width: 'auto' }} onClick={() => navigate('/wishlist')}>
                View Wishlist
              </button>
            </div>
            {wishlistError && <p className="book-card-error">{wishlistError}</p>}
          </div>
        </div>

        {book.description && (
          <div className="book-detail-description">
            <h3>About this book</h3>
            <p dangerouslySetInnerHTML={{ __html: book.description }} />
          </div>
        )}

        {book.averageRating && (
          <div className="book-detail-reviews">
            <h3>Reader Reviews</h3>
            <div className="reviews-summary">
              <div className="reviews-avg-score">{book.averageRating.toFixed(1)}</div>
              <div className="reviews-avg-detail">
                <StarDisplay rating={book.averageRating} count={book.ratingsCount} />
                <span style={{ fontSize: 13, color: 'var(--color-text-2)' }}>
                  Based on {book.ratingsCount} Google Books ratings
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
