import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import DOMPurify from 'dompurify';
import ReadDatePicker from '../components/ReadDatePicker';

function StarDisplay({ rating, count = 0 }) {
  return (
    <div className="book-detail-rating">
      <div className="stars-display">
        {[1, 2, 3, 4, 5].map((star) => (
          <span key={star} className={star <= Math.round(rating) ? 'star-filled' : 'star-empty'}>★</span>
        ))}
      </div>
      {rating != null && <span className="rating-count">{Number(rating).toFixed(1)} ({count} ratings)</span>}
    </div>
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
  const [isRead, setIsRead] = useState(false);
  const [readBookId, setReadBookId] = useState(null);
  const [pickingDate, setPickingDate] = useState(false);
  const [togglingRead, setTogglingRead] = useState(false);

  useEffect(() => {
    let active = true;
    setAdded(false);
    setWishlistError('');
    setAdding(false);
    setIsRead(false);
    setReadBookId(null);
    setPickingDate(false);

    async function loadBook() {
      setLoading(true);
      setError('');
      try {
        const res = await api.get(`/books/${encodeURIComponent(id)}`);
        if (active) setBook(res.data.book);
      } catch (err) {
        if (active) setError(err.response?.data?.error || 'Failed to load book details.');
      } finally {
        if (active) setLoading(false);
      }
    }

    async function loadReadStatus() {
      try {
        const res = await api.get('/read-books');
        if (!active) return;
        const entry = res.data.readBooks.find(r => r.book_id === id);
        if (entry) {
          setIsRead(true);
          setReadBookId(entry.id);
        }
      } catch {
        // read status is non-critical, ignore errors
      }
    }

    loadBook();
    loadReadStatus();
    return () => { active = false; };
  }, [id]);

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

  async function handleConfirmDate(date) {
    setTogglingRead(true);
    try {
      const res = await api.post('/read-books', { book_id: id, read_at: date });
      setIsRead(true);
      setReadBookId(res.data.item.id);
      setPickingDate(false);
    } catch (err) {
      if (err.response?.status === 409) {
        const existingId = err.response?.data?.item?.id;
        setIsRead(true);
        setReadBookId(existingId || null);
        setPickingDate(false);
      }
    } finally {
      setTogglingRead(false);
    }
  }

  async function handleUnmarkRead() {
    if (!readBookId) return;
    setTogglingRead(true);
    try {
      await api.delete(`/read-books/${readBookId}`);
      setIsRead(false);
      setReadBookId(null);
    } catch (err) {
      console.error('Failed to unmark as read:', err);
    } finally {
      setTogglingRead(false);
    }
  }

  if (loading) {
    return (
      <div className="book-detail-content">
        <button className="book-detail-back" onClick={() => navigate(-1)}>← Back</button>
        <p style={{ color: 'var(--color-text-3)', fontSize: 14, marginTop: 8 }}>Loading book details...</p>
      </div>
    );
  }

  if (error || !book) {
    return (
      <div className="book-detail-content">
        <button className="book-detail-back" onClick={() => navigate(-1)}>← Back</button>
        <div className="book-detail-error">
          <div className="book-detail-error-icon">!</div>
          <h3>Something went wrong</h3>
          <p>{error || 'Book not found.'}</p>
          <button className="btn btn-secondary" style={{ width: 'auto', marginTop: 4 }} onClick={() => navigate(-1)}>
            Go back
          </button>
        </div>
      </div>
    );
  }

  return (
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

          {book.averageRating != null && (
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
            {isRead ? (
              <button
                className="btn btn-secondary"
                style={{ width: 'auto' }}
                onClick={handleUnmarkRead}
                disabled={togglingRead}
              >
                {togglingRead ? '...' : '✓ Marked as Read'}
              </button>
            ) : !pickingDate ? (
              <button
                className="btn btn-ghost"
                style={{ width: 'auto' }}
                onClick={() => setPickingDate(true)}
              >
                Mark as Read
              </button>
            ) : null}
          </div>
          {wishlistError && <p className="book-card-error">{wishlistError}</p>}

          {pickingDate && (
            <ReadDatePicker
              onConfirm={handleConfirmDate}
              onCancel={() => setPickingDate(false)}
              loading={togglingRead}
            />
          )}
        </div>
      </div>

      {book.description && (
        <div className="book-detail-description">
          <h3>About this book</h3>
          <p dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(book.description) }} />
        </div>
      )}

      {book.averageRating != null && (
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
  );
}
