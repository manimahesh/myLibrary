import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ReadBookItem from '../components/ReadBookItem';
import api from '../services/api';

function IconCheck() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

export default function ReadBooks() {
  const [readBooks, setReadBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    api.get('/read-books')
      .then(res => {
        if (active) setReadBooks(Array.isArray(res.data.readBooks) ? res.data.readBooks : []);
      })
      .catch(() => {
        if (active) setError('Failed to load read books.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  function handleUnmarked(id) {
    setReadBooks(prev => prev.filter(item => item.id !== id));
  }

  return (
    <div className="read-books-content">
      <div className="section-header">
        <div>
          <h2 className="section-title">Read Books</h2>
          <p className="section-desc">Books you've finished reading, ordered by most recently read</p>
        </div>
        <Link to="/store" className="btn btn-secondary btn-sm" style={{ width: 'auto', textDecoration: 'none' }}>
          Browse Books
        </Link>
      </div>

      {error && <p className="server-error">{error}</p>}

      {loading ? (
        <p style={{ color: 'var(--color-text-3)', fontSize: 14 }}>Loading...</p>
      ) : readBooks.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <IconCheck />
          </div>
          <h3>No books marked as read yet</h3>
          <p>Use the "Mark as Read" button on any book to track what you've finished.</p>
          <Link to="/store" className="btn btn-primary" style={{ textDecoration: 'none', marginTop: 8 }}>
            Browse Books
          </Link>
        </div>
      ) : (
        <div className="read-books-list">
          {readBooks.map(item => (
            <ReadBookItem key={item.id} item={item} onUnmarked={handleUnmarked} />
          ))}
        </div>
      )}
    </div>
  );
}
