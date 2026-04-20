import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import ReadDatePicker from './ReadDatePicker';

function StarRating({ value, onChange }) {
  const [hover, setHover] = useState(0);

  return (
    <div className="star-rating">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          className={`star-btn${star <= (hover || value) ? ' active' : ''}`}
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(star)}
          title={`Rate ${star} star${star > 1 ? 's' : ''}`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

export default function WishlistItem({ item, onRemoved, isRead = false, readBookId = null, onReadToggle }) {
  const navigate = useNavigate();
  const [book, setBook] = useState(null);
  const [bookLoading, setBookLoading] = useState(true);
  const [rating, setRating] = useState(item.rating || 0);
  const [ratingLoading, setRatingLoading] = useState(false);
  const [summary, setSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [editingSummary, setEditingSummary] = useState(false);
  const [summaryText, setSummaryText] = useState('');
  const [summaryError, setSummaryError] = useState('');
  const [savingSum, setSavingSum] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [read, setRead] = useState(isRead);
  const [currentReadBookId, setCurrentReadBookId] = useState(readBookId);
  const [togglingRead, setTogglingRead] = useState(false);
  const [pickingDate, setPickingDate] = useState(false);

  const loadBook = useCallback(async () => {
    try {
      const res = await api.get(`/books/${encodeURIComponent(item.book_id)}`);
      setBook(res.data.book);
    } catch {
      setBook(null);
    } finally {
      setBookLoading(false);
    }
  }, [item.book_id]);

  const loadSummary = useCallback(async () => {
    try {
      const res = await api.get(`/summaries/${encodeURIComponent(item.book_id)}`);
      setSummary(res.data.summary);
      if (res.data.summary) setSummaryText(res.data.summary.summary_text);
    } catch {
      setSummary(null);
    } finally {
      setSummaryLoading(false);
    }
  }, [item.book_id]);

  useEffect(() => {
    loadBook();
    loadSummary();
  }, [loadBook, loadSummary]);

  async function handleRatingChange(newRating) {
    setRating(newRating);
    setRatingLoading(true);
    try {
      await api.put(`/wishlist/${item.id}`, { rating: newRating });
    } catch {
      setRating(item.rating || 0);
    } finally {
      setRatingLoading(false);
    }
  }

  async function handleSaveSummary() {
    if (!summaryText.trim()) return;
    setSavingSum(true);
    setSummaryError('');
    try {
      if (summary) {
        const res = await api.put(`/summaries/${summary.id}`, { summary_text: summaryText.trim() });
        setSummary(res.data.summary);
      } else {
        const res = await api.post('/summaries', { book_id: item.book_id, summary_text: summaryText.trim() });
        setSummary(res.data.summary);
      }
      setEditingSummary(false);
    } catch (err) {
      setSummaryError(err.response?.data?.error || 'Failed to save summary.');
    } finally {
      setSavingSum(false);
    }
  }

  async function handleDeleteSummary() {
    if (!summary) return;
    try {
      await api.delete(`/summaries/${summary.id}`);
      setSummary(null);
      setSummaryText('');
    } catch {
      // ignore
    }
  }

  function startEditSummary() {
    setSummaryText(summary?.summary_text || '');
    setEditingSummary(true);
    setSummaryError('');
  }

  async function handleConfirmDate(date) {
    setTogglingRead(true);
    try {
      const res = await api.post('/read-books', { book_id: item.book_id, read_at: date });
      const newId = res.data.item.id;
      setRead(true);
      setCurrentReadBookId(newId);
      setPickingDate(false);
      onReadToggle?.(item.book_id, newId);
    } catch (err) {
      if (err.response?.status === 409) {
        const existingId = err.response?.data?.item?.id;
        setRead(true);
        setCurrentReadBookId(existingId || null);
        setPickingDate(false);
        onReadToggle?.(item.book_id, existingId || null);
      }
    } finally {
      setTogglingRead(false);
    }
  }

  async function handleUnmarkRead() {
    if (!currentReadBookId) return;
    setTogglingRead(true);
    try {
      await api.delete(`/read-books/${currentReadBookId}`);
      setRead(false);
      setCurrentReadBookId(null);
      onReadToggle?.(item.book_id, null);
    } finally {
      setTogglingRead(false);
    }
  }

  async function handleRemove() {
    if (!window.confirm('Remove this book from your wishlist?')) return;
    setRemoving(true);
    try {
      await api.delete(`/wishlist/${item.id}`);
      onRemoved(item.id);
    } catch {
      setRemoving(false);
    }
  }

  function toDisplayTitle(raw) {
    if (!raw || raw.length <= 2) return raw;
    if (raw.startsWith('isbn:')) return raw.replace(/^isbn:/, 'ISBN: ');
    if (raw.startsWith('nyt-rank:')) return raw.replace(/^nyt-rank:/, 'NYT Rank: ');
    if (raw === raw.toUpperCase()) return raw.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
    return raw;
  }

  const title = toDisplayTitle(book?.title || item.book_id);
  const author = book?.author || '';
  const thumbnail = book?.thumbnail || null;

  return (
    <div className="wishlist-item">
      {/* Cover */}
      {bookLoading ? (
        <div className="wishlist-item-cover-placeholder" />
      ) : thumbnail ? (
        <img
          src={thumbnail}
          alt={title}
          className="wishlist-item-cover"
          onClick={() => navigate(`/books/${encodeURIComponent(item.book_id)}`)}
        />
      ) : (
        <div className="wishlist-item-cover-placeholder">No cover</div>
      )}

      <div className="wishlist-item-body">
        {/* Header */}
        <div className="wishlist-item-header">
          <div>
            <div
              className="wishlist-item-title"
              onClick={() => navigate(`/books/${encodeURIComponent(item.book_id)}`)}
            >
              {title}
            </div>
            {author && <div className="wishlist-item-author">{author}</div>}
          </div>
          <button
            className="btn btn-danger btn-sm"
            onClick={handleRemove}
            disabled={removing}
          >
            {removing ? 'Removing...' : 'Remove'}
          </button>
        </div>

        {/* Star Rating */}
        <div>
          <div className="wishlist-item-summary-label" style={{ marginBottom: 6 }}>
            Your Rating {ratingLoading && <span style={{ fontWeight: 400 }}>— saving...</span>}
          </div>
          <StarRating value={rating} onChange={handleRatingChange} />
        </div>

        {/* Mark as Read */}
        <div>
          {read ? (
            <button
              className="btn btn-secondary btn-sm"
              onClick={handleUnmarkRead}
              disabled={togglingRead}
              style={{ width: 'auto' }}
            >
              {togglingRead ? '...' : '✓ Marked as Read'}
            </button>
          ) : pickingDate ? (
            <ReadDatePicker
              onConfirm={handleConfirmDate}
              onCancel={() => setPickingDate(false)}
              loading={togglingRead}
            />
          ) : (
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => setPickingDate(true)}
              style={{ width: 'auto' }}
            >
              Mark as Read
            </button>
          )}
        </div>

        {/* Summary */}
        <div className="wishlist-item-summary">
          <div className="wishlist-item-summary-label">Personal Summary</div>

          {summaryLoading ? (
            <div className="wishlist-item-loading">Loading...</div>
          ) : editingSummary ? (
            <>
              <textarea
                className="summary-textarea"
                value={summaryText}
                onChange={(e) => setSummaryText(e.target.value)}
                placeholder="Write your personal notes or summary..."
                autoFocus
              />
              {summaryError && <p className="book-card-error">{summaryError}</p>}
              <div className="summary-actions">
                <button
                  className="btn btn-primary btn-sm"
                  style={{ width: 'auto' }}
                  onClick={handleSaveSummary}
                  disabled={savingSum || !summaryText.trim()}
                >
                  {savingSum ? 'Saving...' : 'Save'}
                </button>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => { setEditingSummary(false); setSummaryError(''); }}
                >
                  Cancel
                </button>
              </div>
            </>
          ) : summary ? (
            <>
              <p className="wishlist-item-summary-text">{summary.summary_text}</p>
              <div className="summary-actions">
                <button className="btn btn-ghost btn-sm" onClick={startEditSummary}>Edit</button>
                <button className="btn btn-danger btn-sm" onClick={handleDeleteSummary}>Delete</button>
              </div>
            </>
          ) : (
            <button className="btn btn-ghost btn-sm" onClick={startEditSummary}>
              + Add summary
            </button>
          )}
        </div>
      </div>
    </div>
  );
}