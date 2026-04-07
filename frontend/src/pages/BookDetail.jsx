import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import DOMPurify from 'dompurify';

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

  useEffect(() => {
    let active = true;
    setAdded(false);
    setWishlistError('');
    setAdding(false);

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

    loadBook();
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

  if (loading) {
    return (
      <div className="book-detail-content">
        <p style={{ color: 'var(--color-text-3)', fontSize: 14 }}>Loading book details...</p>
      </div>
    );
  }

  if (error || !book) {
    return (
      <div className="book-detail-content">
        <button className="book-detail-back" onClick={() => navigate(-1)}>← Back</button>
        <p className="server-error">{error || 'Book not found.'}</p>
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
            </div>
            {wishlistError && <p className="book-card-error">{wishlistError}</p>}
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