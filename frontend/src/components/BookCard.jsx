import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function BookCard({ book, inWishlist = false, onAdded }) {
  const navigate = useNavigate();
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const [error, setError] = useState('');

  const isInWishlist = inWishlist || added;

  async function handleAddToWishlist(e) {
    e.stopPropagation();
    if (isInWishlist) return;
    setAdding(true);
    setError('');
    try {
      await api.post('/wishlist', { book_id: book.id });
      setAdded(true);
      onAdded?.(book.id);
    } catch (err) {
      if (err.response?.status === 409) {
        setAdded(true);
        onAdded?.(book.id);
      } else {
        setError(err.response?.data?.error || 'Failed to add');
      }
    } finally {
      setAdding(false);
    }
  }

  function handleCardClick() {
    navigate(`/books/${encodeURIComponent(book.id)}`);
  }

  return (
    <div
      className="book-card"
      onClick={handleCardClick}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleCardClick(); }}
      role="button"
      tabIndex={0}
      aria-label={`View details for ${book.title}`}
    >
      <div className="book-card-cover-wrap">
        {book.thumbnail ? (
          <img src={book.thumbnail} alt={book.title} className="book-card-cover" />
        ) : (
          <div className="book-card-no-cover">No cover</div>
        )}
      </div>
      <div className="book-card-info">
        <h3 className="book-card-title">{book.title}</h3>
        <p className="book-card-author">{book.author}</p>
        {error && <p className="book-card-error">{error}</p>}
        <button
          className="btn btn-primary btn-sm"
          onClick={handleAddToWishlist}
          disabled={adding || isInWishlist}
          style={{ marginTop: 'auto' }}
        >
          {isInWishlist ? 'In Wishlist' : adding ? 'Adding...' : '+ Wishlist'}
        </button>
      </div>
    </div>
  );
}
