import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import WishlistItem from '../components/WishlistItem';
import api from '../services/api';

function IconHeart() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

export default function Wishlist() {
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadWishlist();
  }, []);

  async function loadWishlist() {
    try {
      const res = await api.get('/wishlist');
      // Validate and normalize the payload to ensure it's always an array
      const wishlistData = res.data.wishlist;
      if (Array.isArray(wishlistData)) {
        setWishlist(wishlistData);
      } else {
        setWishlist([]);
      }
    } catch {
      setError('Failed to load wishlist.');
    } finally {
      setLoading(false);
    }
  }

  function handleRemoved(id) {
    setWishlist((prev) => prev.filter((item) => item.id !== id));
  }

  return (
    <div className="wishlist-content">
      <div className="section-header">
        <div>
          <h2 className="section-title">My Wishlist</h2>
          <p className="section-desc">Books you want to read, with your personal ratings and notes</p>
        </div>
        <Link to="/store" className="btn btn-secondary btn-sm" style={{ width: 'auto', textDecoration: 'none' }}>
          Browse Books
        </Link>
      </div>

      {error && <p className="server-error">{error}</p>}

      {loading ? (
        <p style={{ color: 'var(--color-text-3)', fontSize: 14 }}>Loading wishlist...</p>
      ) : wishlist.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <IconHeart />
          </div>
          <h3>Your wishlist is empty</h3>
          <p>Browse the store and add books you want to read.</p>
          <Link to="/store" className="btn btn-primary" style={{ textDecoration: 'none', marginTop: 8 }}>
            Browse Books
          </Link>
        </div>
      ) : (
        <div className="wishlist-list">
          {wishlist.map((item) => (
            <WishlistItem key={item.id} item={item} onRemoved={handleRemoved} />
          ))}
        </div>
      )}
    </div>
  );
}
