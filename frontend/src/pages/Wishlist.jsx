import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import WishlistItem from '../components/WishlistItem';
import Pagination from '../components/Pagination';
import { usePaginatedList } from '../hooks/usePaginatedList';

function IconHeart() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

export default function Wishlist() {
  const {
    items: wishlist, total, totalPages, loading, error,
    limit, setLimit, page, firstPage, prevPage, nextPage, lastPage, removeItem,
  } = usePaginatedList('/wishlist');

  const [readBooksMap, setReadBooksMap] = useState(new Map());

  useEffect(() => {
    let active = true;
    async function loadAllReadBooks() {
      const pageSize = 25;
      let offset = 0;
      const all = [];
      while (true) {
        try {
          const res = await api.get(`/read-books?limit=${pageSize}&offset=${offset}`);
          if (!active) return;
          const { readBooks = [], total = 0 } = res.data;
          all.push(...readBooks);
          offset += readBooks.length;
          if (all.length >= total || readBooks.length === 0) break;
        } catch {
          break;
        }
      }
      if (active) setReadBooksMap(new Map(all.map(i => [i.book_id, i.id])));
    }
    loadAllReadBooks();
    return () => { active = false; };
  }, []);

  function handleRemoved(id) {
    removeItem(id);
  }

  function handleReadToggle(bookId, newReadBookId) {
    setReadBooksMap(prev => {
      const next = new Map(prev);
      if (newReadBookId) next.set(bookId, newReadBookId);
      else next.delete(bookId);
      return next;
    });
  }

  const paginationProps = { page, totalPages, total, limit, onFirst: firstPage, onPrev: prevPage, onNext: nextPage, onLast: lastPage };

  return (
    <div className="wishlist-content">
      <div className="section-header">
        <div>
          <h2 className="section-title">My Wishlist</h2>
          <p className="section-desc">
            Books you want to read, with your personal ratings and notes
            {total !== null && <span className="list-count"> · {total} book{total !== 1 ? 's' : ''}</span>}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div className="per-page-picker">
            <label htmlFor="wishlist-limit">Per page</label>
            <select
              id="wishlist-limit"
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
        <p style={{ color: 'var(--color-text-3)', fontSize: 14 }}>Loading wishlist...</p>
      ) : wishlist.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><IconHeart /></div>
          <h3>Your wishlist is empty</h3>
          <p>Browse the store and add books you want to read.</p>
          <Link to="/store" className="btn btn-primary" style={{ textDecoration: 'none', marginTop: 8 }}>
            Browse Books
          </Link>
        </div>
      ) : (
        <>
          <Pagination {...paginationProps} />
          <div className="wishlist-list">
            {wishlist.map(item => (
              <WishlistItem
                key={item.id}
                item={item}
                onRemoved={handleRemoved}
                isRead={readBooksMap.has(item.book_id)}
                readBookId={readBooksMap.get(item.book_id) ?? null}
                onReadToggle={handleReadToggle}
              />
            ))}
          </div>
          <Pagination {...paginationProps} />
        </>
      )}
    </div>
  );
}
