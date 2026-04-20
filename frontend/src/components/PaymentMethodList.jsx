import { useState, useEffect } from 'react';
import api from '../services/api';
import PaymentMethodForm from './PaymentMethodForm';

const CARD_LABELS = {
  visa: 'Visa',
  mastercard: 'Mastercard',
  amex: 'American Express',
  discover: 'Discover',
};

const CARD_COLORS = {
  visa: '#1a1f71',
  mastercard: '#eb001b',
  amex: '#007bc1',
  discover: '#ff6600',
};

function IconCard() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
      <line x1="1" y1="10" x2="23" y2="10" />
    </svg>
  );
}

function IconPlus() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="16" />
      <line x1="8" y1="12" x2="16" y2="12" />
    </svg>
  );
}

export default function PaymentMethodList() {
  const [methods, setMethods] = useState([]);
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    api.get('/payments')
      .then(res => { if (!cancelled) setMethods(res.data.payment_methods); })
      .catch(() => { if (!cancelled) setError('Failed to load payment methods'); });
    return () => { cancelled = true; };
  }, [refreshKey]);

  function refetch() { setRefreshKey(k => k + 1); }

  async function handleCreate(data) {
    try {
      await api.post('/payments', data);
      setShowForm(false);
      refetch();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add payment method');
    }
  }

  async function handleUpdate(data) {
    try {
      await api.put(`/payments/${editing.id}`, data);
      setEditing(null);
      refetch();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update payment method');
    }
  }

  async function handleSetDefault(id) {
    const method = methods.find((m) => m.id === id);
    if (!method) return;
    try {
      await api.put(`/payments/${id}`, { ...method, is_default: true });
      refetch();
    } catch {
      setError('Failed to set default');
    }
  }

  async function handleDelete(id) {
    try {
      await api.delete(`/payments/${id}`);
      refetch();
    } catch {
      setError('Failed to delete payment method');
    }
  }

  return (
    <div>
      <div className="section-header">
        <div>
          <h2 className="section-title">Payment Methods</h2>
          <p className="section-desc">Manage your saved payment cards</p>
        </div>
        <button className="btn btn-secondary" onClick={() => setShowForm(true)}>
          + Add card
        </button>
      </div>

      {error && <div className="server-error">{error}</div>}

      {methods.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <IconCard />
          </div>
          <h3>No payment methods yet</h3>
          <p>Add a credit or debit card to speed up checkout.</p>
          <button className="btn btn-primary" style={{ width: 'auto' }} onClick={() => setShowForm(true)}>
            Add your first card
          </button>
        </div>
      ) : (
        <div className="cards-grid">
          {methods.map((pm) => (
            <div key={pm.id} className={`card ${pm.is_default ? 'card-default' : ''}`}>
              <div className="card-top">
                <div className="card-icon">
                  <IconCard />
                </div>
                {pm.is_default && <span className="badge badge-accent">Default</span>}
              </div>
              <div className="card-body">
                <div className="card-chip" style={{ color: CARD_COLORS[pm.card_type] || '#475569' }}>
                  {CARD_LABELS[pm.card_type] || pm.card_type}
                </div>
                <div className="card-number">•••• •••• •••• {pm.last_four_digits}</div>
                <div className="card-expiry">
                  Expires {String(pm.expiry_month).padStart(2, '0')}/{pm.expiry_year}
                </div>
              </div>
              <div className="card-footer">
                <div className="card-actions">
                  {!pm.is_default && (
                    <button className="btn btn-ghost" onClick={() => handleSetDefault(pm.id)}>
                      Set default
                    </button>
                  )}
                  <button className="btn btn-ghost" onClick={() => setEditing(pm)}>
                    Edit
                  </button>
                  <button className="btn btn-danger" onClick={() => handleDelete(pm.id)}>
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}

          <button className="card-add" onClick={() => setShowForm(true)}>
            <IconPlus />
            Add card
          </button>
        </div>
      )}

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Add payment method</h2>
              <button className="modal-close" onClick={() => setShowForm(false)}>✕</button>
            </div>
            <PaymentMethodForm onSubmit={handleCreate} onCancel={() => setShowForm(false)} />
          </div>
        </div>
      )}

      {editing && (
        <div className="modal-overlay" onClick={() => setEditing(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Edit payment method</h2>
              <button className="modal-close" onClick={() => setEditing(null)}>✕</button>
            </div>
            <PaymentMethodForm
              paymentMethod={editing}
              onSubmit={handleUpdate}
              onCancel={() => setEditing(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
}