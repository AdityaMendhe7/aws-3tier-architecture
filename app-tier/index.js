const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(helmet());
app.use(cors({ origin: process.env.WEB_TIER_ORIGIN || '*' }));
app.use(express.json());
app.use(morgan('combined'));

// DB connection pool
const pool = mysql.createPool({
  host:     process.env.DB_HOST,
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'webappdb',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', tier: 'app', timestamp: new Date().toISOString() });
});

// ── Books CRUD ────────────────────────────────────────────────────────────────
app.get('/api/books', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM books ORDER BY id DESC');
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('GET /api/books error:', err.message);
    res.status(500).json({ success: false, error: 'Database error' });
  }
});

app.get('/api/books/:id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM books WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ success: false, error: 'Not found' });
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Database error' });
  }
});

app.post('/api/books', async (req, res) => {
  const { amount, description } = req.body;
  if (!amount || !description) {
    return res.status(400).json({ success: false, error: 'amount and description are required' });
  }
  try {
    const [result] = await pool.query(
      'INSERT INTO books (amount, description) VALUES (?, ?)',
      [amount, description]
    );
    res.status(201).json({ success: true, data: { id: result.insertId, amount, description } });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Database error' });
  }
});

app.put('/api/books/:id', async (req, res) => {
  const { amount, description } = req.body;
  try {
    const [result] = await pool.query(
      'UPDATE books SET amount = ?, description = ? WHERE id = ?',
      [amount, description, req.params.id]
    );
    if (!result.affectedRows) return res.status(404).json({ success: false, error: 'Not found' });
    res.json({ success: true, data: { id: parseInt(req.params.id), amount, description } });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Database error' });
  }
});

app.delete('/api/books/:id', async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM books WHERE id = ?', [req.params.id]);
    if (!result.affectedRows) return res.status(404).json({ success: false, error: 'Not found' });
    res.json({ success: true, message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Database error' });
  }
});

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`[App Tier] Server running on port ${PORT}`);
});
