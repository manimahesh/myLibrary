import { useState, useEffect } from 'react';
import api from '../services/api';
import PaymentMethodForm from './PaymentMethodForm';

function formatCardDisplay(pm) {
  const typeLabels = { visa: 'Visa', mastercard: 'Mastercard', amex: 'Amex', discover: 'Discover' };
  return `${typeLabels[pm.card_type] || pm.card_type} ****${pm.last_four_digits} (${String(pm.expiry_month).padStart(2, '0')}/${pm.expiry_year})`;
}

export default function PaymentMethodList() {
  const [methods, setMethods] = useState([]);
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchMethods();
  }, []);

  async function fetchMethods() {
    try {
      const res = await api.get('/payments');
      setMethods(res.data.payment_methods);
    } catch {
      setError('Failed to load payment methods');
    }
  }

  async function handleCreate(data) {
    try {
      await api.post('/payments', data);
      setShowForm(false);
      fetchMethods();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add payment method');
    }
  }

  async function handleUpdate(data) {
    try {
      await api.put(`/payments/${editing.id}`, data);
      setEditing(null);
      fetchMethods();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update payment method');
    }
  }

  async function handleSetDefault(id) {
    const method = methods.find((m) => m.id === id);
    if (!method) return;
    try {
      await api.put(`/payments/${id}`, { ...method, is_default: true });
      fetchMethods();
    } catch {
      setError('Failed to set default');
    }
  }

  async function handleDelete(id) {
    try {
      await api.delete(`/payments/${id}`);
      fetchMethods();
    } catch {
      setError('Failed to delete payment method');
    }
  }

  if (editing) {
    return (
      <div>
        <h3>Edit Payment Method</h3>
        <PaymentMethodForm
          paymentMethod={editing}
          onSubmit={handleUpdate}
          onCancel={() => setEditing(null)}
        />
      </div>
    );
  }

  if (showForm) {
    return (
      <div>
        <h3>Add Payment Method</h3>
        <PaymentMethodForm onSubmit={handleCreate} onCancel={() => setShowForm(false)} />
      </div>
    );
  }

  return (
    <div className="payment-list">
      <div className="section-header">
        <h3>Payment Methods</h3>
        <button onClick={() => setShowForm(true)}>Add Payment Method</button>
      </div>
      {error && <div className="error">{error}</div>}
      {methods.length === 0 ? (
        <p>No payment methods saved.</p>
      ) : (
        <ul>
          {methods.map((pm) => (
            <li key={pm.id} className="payment-item">
              <div>
                <p>{formatCardDisplay(pm)}</p>
                {pm.is_default && <span className="badge">Default</span>}
              </div>
              <div className="item-actions">
                {!pm.is_default && (
                  <button onClick={() => handleSetDefault(pm.id)}>Set Default</button>
                )}
                <button onClick={() => setEditing(pm)}>Edit</button>
                <button onClick={() => handleDelete(pm.id)}>Delete</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
