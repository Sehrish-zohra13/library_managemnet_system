import express from 'express';
import pool from '../config/db.js';
import { authMiddleware, adminOnly } from '../middleware/auth.js';

const router = express.Router();

// GET /api/books - List books with search, filter, pagination
router.get('/', async (req, res) => {
  try {
    const { search, category, availability, page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    let where = [];
    let params = [];

    if (search) {
      where.push('(b.title LIKE ? OR b.author LIKE ? OR b.isbn LIKE ?)');
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (category && category !== 'All') {
      where.push('b.category = ?');
      params.push(category);
    }
    if (availability === 'available') {
      where.push('(b.quantity - b.issued_count) > 0');
    } else if (availability === 'issued') {
      where.push('b.issued_count >= b.quantity');
    }

    const whereClause = where.length > 0 ? 'WHERE ' + where.join(' AND ') : '';

    const [countResult] = await pool.query(
      `SELECT COUNT(*) as total FROM books b ${whereClause}`, params
    );

    const [rows] = await pool.query(
      `SELECT b.*, (b.quantity - b.issued_count) as available_count
       FROM books b ${whereClause}
       ORDER BY b.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );

    res.json({
      books: rows,
      total: countResult[0].total,
      page: parseInt(page),
      totalPages: Math.ceil(countResult[0].total / parseInt(limit)),
    });
  } catch (err) {
    console.error('Get books error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// GET /api/books/categories
router.get('/categories', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT DISTINCT category FROM books ORDER BY category');
    res.json(rows.map(r => r.category));
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

// GET /api/books/stats
router.get('/stats', async (req, res) => {
  try {
    const [total] = await pool.query('SELECT COUNT(*) as count, SUM(quantity) as totalCopies FROM books');
    const [issued] = await pool.query('SELECT SUM(issued_count) as count FROM books');
    const [available] = await pool.query('SELECT SUM(quantity - issued_count) as count FROM books');
    res.json({
      totalBooks: total[0].totalCopies || 0,
      totalTitles: total[0].count || 0,
      issuedBooks: issued[0].count || 0,
      availableBooks: available[0].count || 0,
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

// GET /api/books/popular
router.get('/popular', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT b.*, COUNT(i.id) as borrow_count, (b.quantity - b.issued_count) as available_count
      FROM books b
      LEFT JOIN issues i ON b.id = i.book_id
      GROUP BY b.id
      ORDER BY borrow_count DESC
      LIMIT 10
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

// GET /api/books/:id
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT *, (quantity - issued_count) as available_count FROM books WHERE id = ?',
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Book not found.' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

// POST /api/books - Admin: Add book
router.post('/', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { title, author, category, quantity, floor_num, row_num, rack_num, isbn, year, description, cover_url } = req.body;
    if (!title || !author) return res.status(400).json({ error: 'Title and author required.' });

    const [result] = await pool.query(
      `INSERT INTO books (title, author, category, quantity, floor_num, row_num, rack_num, isbn, year, description, cover_url)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [title, author, category || 'General', quantity || 1, floor_num || 1, row_num || 1, rack_num || 1, isbn, year, description, cover_url]
    );

    const [rows] = await pool.query('SELECT *, (quantity - issued_count) as available_count FROM books WHERE id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('Add book error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// PUT /api/books/:id - Admin: Update book
router.put('/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { title, author, category, quantity, floor_num, row_num, rack_num, isbn, year, description, cover_url } = req.body;
    await pool.query(
      `UPDATE books SET title=?, author=?, category=?, quantity=?, floor_num=?, row_num=?, rack_num=?, isbn=?, year=?, description=?, cover_url=? WHERE id=?`,
      [title, author, category, quantity, floor_num, row_num, rack_num, isbn, year, description, cover_url, req.params.id]
    );
    const [rows] = await pool.query('SELECT *, (quantity - issued_count) as available_count FROM books WHERE id = ?', [req.params.id]);
    res.json(rows[0]);
  } catch (err) {
    console.error('Update book error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// DELETE /api/books/:id - Admin: Delete book
router.delete('/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    await pool.query('DELETE FROM books WHERE id = ?', [req.params.id]);
    res.json({ message: 'Book deleted.' });
  } catch (err) {
    console.error('Delete book error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

export default router;
