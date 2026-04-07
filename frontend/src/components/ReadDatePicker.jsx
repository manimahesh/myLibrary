import { useState } from 'react';

export default function ReadDatePicker({ onConfirm, onCancel, loading = false }) {
  const today = new Date().toISOString().split('T')[0];
  const [date, setDate] = useState(today);

  return (
    <div className="read-date-picker">
      <label className="read-date-picker-label">Date read</label>
      <input
        type="date"
        className="read-date-picker-input"
        value={date}
        max={today}
        onChange={(e) => setDate(e.target.value)}
      />
      <div className="read-date-picker-actions">
        <button
          className="btn btn-primary btn-sm"
          style={{ width: 'auto' }}
          onClick={() => onConfirm(date)}
          disabled={loading || !date}
        >
          {loading ? 'Saving...' : 'Confirm'}
        </button>
        <button
          className="btn btn-ghost btn-sm"
          onClick={onCancel}
          disabled={loading}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
