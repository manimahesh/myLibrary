import { Link } from 'react-router-dom';
import ReadBookItem from '../components/ReadBookItem';
import Pagination from '../components/Pagination';
import { usePaginatedList } from '../hooks/usePaginatedList';

function IconCheck() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

export default function ReadBooks() {
  const {
    items: readBooks, total, totalPages, loading, error,
    limit, setLimit, page, firstPage, prevPage, nextPage, lastPage, removeItem,
  } = usePaginatedList('/read-books');

  const paginationProps = { page, totalPages, total, limit, onFirst: firstPage, onPrev: prevPage, onNext: nextPage, onLast: lastPage };

  return (
    <div className="read-books-content">
      <div className="section-header">
        <div>
          <h2 className="section-title">Books I&apos;ve Read</h2>
          <p className="section-desc">
            Books you&apos;ve finished reading, ordered by most recently read
            {total !== null && <span className="list-count"> · {total} book{total !== 1 ? 's' : ''}</span>}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div className="per-page-picker">
            <label htmlFor="readbooks-limit">Per page</label>
            <select
              id="readbooks-limit"
              value={limit}
              onChange={e => setLimit(e.target.value)}
            >
              <option value={10}>10</option>
              <option value={15}>15</option>
              <option value={25}>25</option>
            </select>
          </div>
          <Link to="/store" className="btn btn-secondary btn-sm" style={{ width: 'auto', textDecoration: 'none' }}>
            Browse Books
          </Link>
        </div>
      </div>

      {error && <p className="server-error">{error}</p>}

      {loading ? (
        <p style={{ color: 'var(--color-text-3)', fontSize: 14 }}>Loading...</p>
      ) : readBooks.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><IconCheck /></div>
          <h3>No books marked as read yet</h3>
          <p>Use the &quot;Mark as Read&quot; button on any book to track what you&apos;ve finished.</p>
          <Link to="/store" className="btn btn-primary" style={{ textDecoration: 'none', marginTop: 8 }}>
            Browse Books
          </Link>
        </div>
      ) : (
        <>
          <Pagination {...paginationProps} />
          <div className="read-books-list">
            {readBooks.map(item => (
              <ReadBookItem key={item.id} item={item} onUnmarked={removeItem} />
            ))}
          </div>
          <Pagination {...paginationProps} />
        </>
      )}
    </div>
  );
}
