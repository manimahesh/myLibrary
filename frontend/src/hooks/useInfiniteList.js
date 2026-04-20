import { useState, useEffect, useRef, useCallback } from 'react';
import api from '../services/api';

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 25;

export function useInfiniteList(endpoint, { limit: initialLimit = DEFAULT_LIMIT } = {}) {
  const [limit, setLimitState] = useState(
    Math.min(Math.max(parseInt(initialLimit, 10), 1), MAX_LIMIT)
  );
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const offsetRef = useRef(0);
  const activeRef = useRef(true);

  const hasMore = total === null || items.length < total;

  // Reset and reload from scratch whenever limit changes
  const load = useCallback(async (currentLimit) => {
    setLoading(true);
    setError('');
    setItems([]);
    setTotal(null);
    offsetRef.current = 0;

    try {
      const res = await api.get(`${endpoint}?limit=${currentLimit}&offset=0`);
      if (!activeRef.current) return;
      const { items: newItems, total: newTotal } = extractPayload(endpoint, res.data);
      setItems(newItems);
      setTotal(newTotal);
      offsetRef.current = newItems.length;
    } catch {
      if (activeRef.current) setError('Failed to load.');
    } finally {
      if (activeRef.current) setLoading(false);
    }
  }, [endpoint]);

  useEffect(() => {
    activeRef.current = true;
    load(limit);
    return () => { activeRef.current = false; };
  }, [load, limit]);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore || loading) return;
    setLoadingMore(true);
    try {
      const res = await api.get(`${endpoint}?limit=${limit}&offset=${offsetRef.current}`);
      if (!activeRef.current) return;
      const { items: newItems } = extractPayload(endpoint, res.data);
      setItems(prev => [...prev, ...newItems]);
      offsetRef.current += newItems.length;
    } catch {
      // silently ignore load-more errors
    } finally {
      if (activeRef.current) setLoadingMore(false);
    }
  }, [endpoint, limit, loadingMore, hasMore, loading]);

  function setLimit(newLimit) {
    const clamped = Math.min(Math.max(parseInt(newLimit, 10), 1), MAX_LIMIT);
    setLimitState(clamped);
  }

  function removeItem(id) {
    setItems(prev => prev.filter(item => item.id !== id));
    setTotal(prev => (prev !== null ? prev - 1 : prev));
  }

  return { items, total, loading, loadingMore, hasMore, error, limit, setLimit, loadMore, removeItem };
}

function extractPayload(endpoint, data) {
  // Both APIs return different root keys
  if (data.wishlist !== undefined) return { items: data.wishlist, total: data.total };
  if (data.readBooks !== undefined) return { items: data.readBooks, total: data.total };
  return { items: [], total: 0 };
}
