import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import ReadDatePicker from './ReadDatePicker';

export default function BookCard({ book, inWishlist = false, onAdded, inReadBooks = false, readBookId = null, onReadToggle }) {
  const navigate = useNavigate();
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const [error, setError] = useState('');
  const [isRead, setIsRead] = useState(inReadBooks);
  const [currentReadBookId, setCurrentReadBookId] = useState(readBookId);
  const [pickingDate, setPickingDate] = useState(false);
  const [togglingRead, setTogglingRead] = useState(false);

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

  function handleReadClick(e) {
    e.stopPropagation();
    if (isRead) {
      handleUnmark();
    } else {
      setPickingDate(true);
    }
  }

  async function handleConfirmDate(date) {
    setTogglingRead(true);
    try {
      const res = await api.post('/read-books', { book_id: book.id, read_at: date });
      const newId = res.data.item.id;
      setIsRead(true);
      setCurrentReadBookId(newId);
      setPickingDate(false);
      onReadToggle?.(book.id, newId);
    } catch (err) {
      if (err.response?.status === 409) {
        const existingId = err.response?.data?.item?.id;
        setIsRead(true);
        setCurrentReadBookId(existingId || null);
        setPickingDate(false);
        onReadToggle?.(book.id, existingId || null);
      }
    } finally {
      setTogglingRead(false);
    }
  }

  async function handleUnmark() {
    if (!currentReadBookId) return;
    setTogglingRead(true);
    try {
      await api.delete(`/read-books/${currentReadBookId}`);
      setIsRead(false);
      setCurrentReadBookId(null);
      onReadToggle?.(book.id, null);
    } finally {
      setTogglingRead(false);
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
        {onReadToggle !== undefined && !pickingDate && (
          <button
            className={`btn btn-sm${isRead ? ' btn-secondary' : ' btn-ghost'}`}
            onClick={handleReadClick}
            disabled={togglingRead}
            style={{ marginTop: 4 }}
          >
            {togglingRead ? '...' : isRead ? '✓ Read' : 'Mark as Read'}
          </button>
        )}
        {pickingDate && (
          <div onClick={(e) => e.stopPropagation()}>
            <ReadDatePicker
              onConfirm={handleConfirmDate}
              onCancel={() => setPickingDate(false)}
              loading={togglingRead}
            />
          </div>
        )}
      </div>
    </div>
  );
}
