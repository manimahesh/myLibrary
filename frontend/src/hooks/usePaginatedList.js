import { useState, useEffect, useRef, useCallback } from 'react';
import api from '../services/api';

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 25;

export function usePaginatedList(endpoint, { limit: initialLimit = DEFAULT_LIMIT } = {}) {
  const [limit, setLimitState] = useState(
    Math.min(Math.max(parseInt(initialLimit, 10), 1), MAX_LIMIT)
  );
  const [page, setPage] = useState(0);
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const activeRef = useRef(true);

  const totalPages = total !== null ? Math.ceil(total / limit) : null;

  const load = useCallback(async (currentLimit, currentPage) => {
    setLoading(true);
    setError('');
    const offset = currentPage * currentLimit;

    try {
      const res = await api.get(`${endpoint}?limit=${currentLimit}&offset=${offset}`);
      if (!activeRef.current) return;
      const { items: newItems, total: newTotal } = extractPayload(endpoint, res.data);
      setItems(newItems);
      setTotal(newTotal);
    } catch {
      if (activeRef.current) setError('Failed to load.');
    } finally {
      if (activeRef.current) setLoading(false);
    }
  }, [endpoint]);

  useEffect(() => {
    activeRef.current = true;
    load(limit, page);
    return () => { activeRef.current = false; };
  }, [load, limit, page]);

  function setLimit(newLimit) {
    const clamped = Math.min(Math.max(parseInt(newLimit, 10), 1), MAX_LIMIT);
    setLimitState(clamped);
    setPage(0);
  }

  function firstPage() { setPage(0); }
  function lastPage() { if (totalPages !== null) setPage(totalPages - 1); }
  function nextPage() { setPage(p => (totalPages !== null && p < totalPages - 1 ? p + 1 : p)); }
  function prevPage() { setPage(p => (p > 0 ? p - 1 : 0)); }

  function removeItem(id) {
    setItems(prev => prev.filter(item => item.id !== id));
    setTotal(prev => (prev !== null ? prev - 1 : prev));
  }

  return {
    items, total, totalPages, loading, error,
    limit, setLimit,
    page, firstPage, prevPage, nextPage, lastPage,
    removeItem,
  };
}

function extractPayload(endpoint, data) {
  if (data.wishlist !== undefined) return { items: data.wishlist, total: data.total };
  if (data.readBooks !== undefined) return { items: data.readBooks, total: data.total };
  return { items: [], total: 0 };
}
