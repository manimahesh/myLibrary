import { useState, useEffect } from 'react';
import api from '../services/api';
import AddressForm from './AddressForm';

export default function AddressList() {
  const [addresses, setAddresses] = useState([]);
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAddresses();
  }, []);

  async function fetchAddresses() {
    try {
      const res = await api.get('/addresses');
      setAddresses(res.data.addresses);
    } catch {
      setError('Failed to load addresses');
    }
  }

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

  if (editing) {
    return (
      <div>
        <h3>Edit Address</h3>
        <AddressForm address={editing} onSubmit={handleUpdate} onCancel={() => setEditing(null)} />
      </div>
    );
  }

  if (showForm) {
    return (
      <div>
        <h3>Add Address</h3>
        <AddressForm onSubmit={handleCreate} onCancel={() => setShowForm(false)} />
      </div>
    );
  }

  return (
    <div className="address-list">
      <div className="section-header">
        <h3>Addresses</h3>
        <button onClick={() => setShowForm(true)}>Add Address</button>
      </div>
      {error && <div className="error">{error}</div>}
      {addresses.length === 0 ? (
        <p>No addresses saved.</p>
      ) : (
        <ul>
          {addresses.map((addr) => (
            <li key={addr.id} className="address-item">
              <div>
                <p>{addr.street}</p>
                <p>
                  {addr.city}, {addr.state} {addr.postal_code}
                </p>
                <p>{addr.country}</p>
                {addr.is_default && <span className="badge">Default</span>}
              </div>
              <div className="item-actions">
                <button onClick={() => setEditing(addr)}>Edit</button>
                <button onClick={() => handleDelete(addr.id)}>Delete</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
