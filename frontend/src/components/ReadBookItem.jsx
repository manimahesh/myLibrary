import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

export default function ReadBookItem({ item, onUnmarked }) {
  const [removing, setRemoving] = useState(false);

  async function handleUnmark() {
    if (!window.confirm('Remove this book from your read list?')) return;
    setRemoving(true);
    try {
      await api.delete(`/read-books/${item.id}`);
      onUnmarked(item.id);
    } catch {
      setRemoving(false);
    }
  }

  const rawTitle = item.title || item.book_id;
  const title = (() => {
    if (!rawTitle || rawTitle.length <= 2) return rawTitle;
    if (rawTitle.startsWith('isbn:')) return rawTitle.replace(/^isbn:/, 'ISBN: ');
    if (rawTitle.startsWith('nyt-rank:')) return rawTitle.replace(/^nyt-rank:/, 'NYT Rank: ');
    if (rawTitle === rawTitle.toUpperCase()) return rawTitle.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
    return rawTitle;
  })();
  const author = item.author || '';
  const thumbnail = item.thumbnail || null;
  const readDate = new Date(item.read_at).toLocaleDateString(undefined, {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  return (
    <div className="read-book-item">
      {thumbnail ? (
        <Link to={`/books/${encodeURIComponent(item.book_id)}`}>
          <img
            src={thumbnail}
            alt={title}
            className="read-book-cover"
          />
        </Link>
      ) : (
        <div className="read-book-cover-placeholder">No cover</div>
      )}

      <div className="read-book-body">
        <div className="read-book-info">
          <Link
            to={`/books/${encodeURIComponent(item.book_id)}`}
            className="read-book-title"
          >
            {title}
          </Link>
          {author && <div className="read-book-author">{author}</div>}
          <div className="read-book-date">Read on {readDate}</div>
        </div>
        <div className="read-book-actions">
          <button
            className="btn btn-secondary btn-sm"
            onClick={handleUnmark}
            disabled={removing}
          >
            {removing ? 'Removing...' : 'Unmark as Read'}
          </button>
        </div>
      </div>
    </div>
  );
}
