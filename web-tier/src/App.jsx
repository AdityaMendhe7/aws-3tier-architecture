import { useState, useEffect } from 'react';

const API_BASE = process.env.REACT_APP_API_URL || '/api';

export default function App() {
  const [books, setBooks] = useState([]);
  const [form, setForm] = useState({ amount: '', description: '' });
  const [editing, setEditing] = useState(null);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchBooks = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/books`);
      const json = await res.json();
      if (json.success) setBooks(json.data);
    } catch {
      setStatus('❌ Failed to fetch books');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBooks(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const url    = editing ? `${API_BASE}/books/${editing}` : `${API_BASE}/books`;
    const method = editing ? 'PUT' : 'POST';
    try {
      const res  = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (json.success) {
        setStatus(editing ? '✅ Updated!' : '✅ Added!');
        setForm({ amount: '', description: '' });
        setEditing(null);
        fetchBooks();
      }
    } catch {
      setStatus('❌ Save failed');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this entry?')) return;
    try {
      const res  = await fetch(`${API_BASE}/books/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) { setStatus('🗑️ Deleted'); fetchBooks(); }
    } catch {
      setStatus('❌ Delete failed');
    }
  };

  const handleEdit = (book) => {
    setEditing(book.id);
    setForm({ amount: book.amount, description: book.description });
  };

  return (
    <div style={{ fontFamily: 'Inter, sans-serif', maxWidth: 800, margin: '40px auto', padding: '0 20px' }}>
      <h1 style={{ color: '#1a1a2e' }}>📚 Books Inventory</h1>
      <p style={{ color: '#666', fontSize: 13 }}>
        AWS 3-Tier Architecture · Web → App → RDS
      </p>

      {/* Form */}
      <form onSubmit={handleSubmit} style={{ background: '#f8fafc', padding: 20, borderRadius: 8, marginBottom: 24 }}>
        <h3 style={{ margin: '0 0 12px' }}>{editing ? 'Edit Entry' : 'Add New Entry'}</h3>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <input
            required
            type="number"
            step="0.01"
            placeholder="Amount"
            value={form.amount}
            onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
            style={{ flex: 1, minWidth: 120, padding: '8px 12px', borderRadius: 6, border: '1px solid #ccc' }}
          />
          <input
            required
            type="text"
            placeholder="Description"
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            style={{ flex: 3, minWidth: 200, padding: '8px 12px', borderRadius: 6, border: '1px solid #ccc' }}
          />
          <button type="submit" style={{ padding: '8px 20px', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
            {editing ? 'Update' : 'Add'}
          </button>
          {editing && (
            <button type="button" onClick={() => { setEditing(null); setForm({ amount: '', description: '' }); }}
              style={{ padding: '8px 16px', background: '#e5e7eb', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
              Cancel
            </button>
          )}
        </div>
      </form>

      {status && <p style={{ color: '#4f46e5', fontWeight: 500 }}>{status}</p>}

      {/* Table */}
      {loading ? <p>Loading...</p> : (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ background: '#1a1a2e', color: '#fff' }}>
              <th style={{ padding: '10px 12px', textAlign: 'left' }}>ID</th>
              <th style={{ padding: '10px 12px', textAlign: 'left' }}>Amount</th>
              <th style={{ padding: '10px 12px', textAlign: 'left' }}>Description</th>
              <th style={{ padding: '10px 12px', textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {books.map((b, i) => (
              <tr key={b.id} style={{ background: i % 2 === 0 ? '#f9fafb' : '#fff' }}>
                <td style={{ padding: '10px 12px' }}>{b.id}</td>
                <td style={{ padding: '10px 12px' }}>${parseFloat(b.amount).toFixed(2)}</td>
                <td style={{ padding: '10px 12px' }}>{b.description}</td>
                <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                  <button onClick={() => handleEdit(b)} style={{ marginRight: 8, padding: '4px 12px', background: '#e0e7ff', border: 'none', borderRadius: 4, cursor: 'pointer' }}>Edit</button>
                  <button onClick={() => handleDelete(b.id)} style={{ padding: '4px 12px', background: '#fee2e2', border: 'none', borderRadius: 4, cursor: 'pointer' }}>Delete</button>
                </td>
              </tr>
            ))}
            {!books.length && (
              <tr><td colSpan={4} style={{ textAlign: 'center', padding: 24, color: '#999' }}>No entries yet. Add one above!</td></tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}
