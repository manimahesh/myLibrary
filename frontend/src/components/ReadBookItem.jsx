import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function ReadBookItem({ item, onUnmarked }) {
  const navigate = useNavigate();
  const [book, setBook] = useState(null);
  const [removing, setRemoving] = useState(false);

  useEffect(() => {
    let active = true;
    api.get(`/books/${encodeURIComponent(item.book_id)}`)
      .then(res => { if (active) setBook(res.data.book); })
      .catch(() => { if (active) setBook(null); });
    return () => { active = false; };
  }, [item.book_id]);

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

  const title = book?.title || item.book_id;
  const author = book?.author || '';
  const thumbnail = book?.thumbnail || null;
  const readDate = new Date(item.read_at).toLocaleDateString(undefined, {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  return (
    <div className="read-book-item">
      {thumbnail ? (
        <img
          src={thumbnail}
          alt={title}
          className="read-book-cover"
          onClick={() => navigate(`/books/${encodeURIComponent(item.book_id)}`)}
        />
      ) : (
        <div className="read-book-cover-placeholder">No cover</div>
      )}

      <div className="read-book-body">
        <div className="read-book-header">
          <div>
            <div
              className="read-book-title"
              onClick={() => navigate(`/books/${encodeURIComponent(item.book_id)}`)}
            >
              {title}
            </div>
            {author && <div className="read-book-author">{author}</div>}
            <div className="read-book-date">Read on {readDate}</div>
          </div>
          <button
            className="btn btn-secondary btn-sm"
            onClick={handleUnmark}
            disabled={removing}
            style={{ width: 'auto', flexShrink: 0 }}
          >
            {removing ? 'Removing...' : 'Unmark as Read'}
          </button>
        </div>
      </div>
    </div>
  );
}
