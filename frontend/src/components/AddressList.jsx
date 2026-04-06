import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import AddressForm from './AddressForm';

function IconPin() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
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

export default function AddressList() {
  const [addresses, setAddresses] = useState([]);
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');

  const fetchAddresses = useCallback(async () => {
    try {
      const res = await api.get('/addresses');
      setAddresses(res.data.addresses);
    } catch {
      setError('Failed to load addresses');
    }
  }, []);

  useEffect(() => {
    fetchAddresses();
  }, [fetchAddresses]);

  async function handleCreate(data) {
    try {
      await api.post('/addresses', data);
      setShowForm(false);
      fetchAddresses();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create address');
    }
  }

  async function handleUpdate(data) {
    try {
      await api.put(`/addresses/${editing.id}`, data);
      setEditing(null);
      fetchAddresses();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update address');
    }
  }

  async function handleDelete(id) {
    try {
      await api.delete(`/addresses/${id}`);
      fetchAddresses();
    } catch {
      setError('Failed to delete address');
    }
  }

  return (
    <div>
      <div className="section-header">
        <div>
          <h2 className="section-title">Addresses</h2>
          <p className="section-desc">Manage your saved shipping addresses</p>
        </div>
        <button className="btn btn-secondary" onClick={() => setShowForm(true)}>
          + Add address
        </button>
      </div>

      {error && <div className="server-error">{error}</div>}

      {addresses.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <IconPin />
          </div>
          <h3>No addresses yet</h3>
          <p>Add a shipping address to have it ready when you need it.</p>
          <button className="btn btn-secondary" onClick={() => setShowForm(true)}>
            Add your first address
          </button>
        </div>
      ) : (
        <div className="cards-grid">
          {addresses.map((addr) => (
            <div key={addr.id} className={`card ${addr.is_default ? 'card-default' : ''}`}>
              <div className="card-top">
                <div className="card-icon">
                  <IconPin />
                </div>
                {addr.is_default && <span className="badge badge-accent">Default</span>}
              </div>
              <div className="card-body">
                <div className="card-title">{addr.street}</div>
                <div className="card-subtitle">
                  {addr.city}, {addr.state} {addr.postal_code}
                  <br />
                  {addr.country}
                </div>
              </div>
              <div className="card-footer">
                <div className="card-actions">
                  <button className="btn btn-ghost" onClick={() => setEditing(addr)}>
                    Edit
                  </button>
                  <button className="btn btn-danger" onClick={() => handleDelete(addr.id)}>
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}

          <button className="card-add" onClick={() => setShowForm(true)}>
            <IconPlus />
            Add address
          </button>
        </div>
      )}

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Add address</h2>
              <button className="modal-close" onClick={() => setShowForm(false)}>✕</button>
            </div>
            <AddressForm onSubmit={handleCreate} onCancel={() => setShowForm(false)} />
          </div>
        </div>
      )}

      {editing && (
        <div className="modal-overlay" onClick={() => setEditing(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Edit address</h2>
              <button className="modal-close" onClick={() => setEditing(null)}>✕</button>
            </div>
            <AddressForm address={editing} onSubmit={handleUpdate} onCancel={() => setEditing(null)} />
          </div>
        </div>
      )}
    </div>
  );
}