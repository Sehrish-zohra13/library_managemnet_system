import express from 'express';
import pool from '../config/db.js';
import { authMiddleware, adminOnly } from '../middleware/auth.js';
import { recalculatePositions } from '../jobs/expiry-check.js';

const router = express.Router();

// POST /api/reservations - Reserve a book
router.post('/', authMiddleware, async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const { book_id } = req.body;
    const user_id = req.user.id;

    // Check if book exists
    const [book] = await conn.query('SELECT * FROM books WHERE id = ?', [book_id]);
    if (book.length === 0) return res.status(404).json({ error: 'Book not found.' });

    // Check if already reserved by this user
    const [existing] = await conn.query(
      "SELECT * FROM reservations WHERE user_id = ? AND book_id = ? AND status IN ('Active', 'Notified')",
      [user_id, book_id]
    );
    if (existing.length > 0) {
      return res.status(400).json({ error: 'You already have an active reservation for this book.' });
    }

    // Check if user already has this book issued
    const [issued] = await conn.query(
      "SELECT * FROM issues WHERE user_id = ? AND book_id = ? AND status = 'Issued'",
      [user_id, book_id]
    );
    if (issued.length > 0) {
      return res.status(400).json({ error: 'You already have this book issued.' });
    }

    // Get queue position (count active + notified reservations)
    const [queue] = await conn.query(
      "SELECT COUNT(*) as pos FROM reservations WHERE book_id = ? AND status IN ('Active', 'Notified')",
      [book_id]
    );
    const position = queue[0].pos + 1;

    await conn.query(
      'INSERT INTO reservations (user_id, book_id, position, status) VALUES (?, ?, ?, ?)',
      [user_id, book_id, position, 'Active']
    );

    res.status(201).json({ message: 'Book reserved successfully.', position });
  } catch (err) {
    console.error('Reserve error:', err);
    res.status(500).json({ error: 'Server error.' });
  } finally {
    conn.release();
  }
});

// GET /api/reservations/my - User's reservations (all statuses)
router.get('/my', authMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT r.*, b.title, b.author, b.category, b.cover_url, b.isbn, b.issued_count, b.quantity,
        (SELECT COUNT(*) FROM reservations r2 
         WHERE r2.book_id = r.book_id AND r2.status IN ('Active', 'Notified') AND r2.id < r.id) + 1 as current_position,
        (SELECT COUNT(*) FROM reservations r3 
         WHERE r3.book_id = r.book_id AND r3.status IN ('Active', 'Notified')) as total_in_queue
      FROM reservations r
      JOIN books b ON r.book_id = b.id
      WHERE r.user_id = ? AND r.status IN ('Active', 'Notified')
      ORDER BY r.status = 'Notified' DESC, r.created_at DESC
    `, [req.user.id]);
    res.json(rows);
  } catch (err) {
    console.error('Get reservations error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// GET /api/reservations/history - User's past reservations
router.get('/history', authMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT r.*, b.title, b.author, b.category, b.cover_url
      FROM reservations r
      JOIN books b ON r.book_id = b.id
      WHERE r.user_id = ? AND r.status IN ('Fulfilled', 'Expired', 'Cancelled')
      ORDER BY r.created_at DESC
      LIMIT 20
    `, [req.user.id]);
    res.json(rows);
  } catch (err) {
    console.error('Get reservation history error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// GET /api/reservations/notifications - Notified reservations for current user
router.get('/notifications', authMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT r.*, b.title, b.author, b.cover_url
      FROM reservations r
      JOIN books b ON r.book_id = b.id
      WHERE r.user_id = ? AND r.status = 'Notified'
      ORDER BY r.notified_at DESC
    `, [req.user.id]);
    res.json(rows);
  } catch (err) {
    console.error('Get notifications error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// GET /api/reservations/check/:bookId - Check if user has active reservation for a book
router.get('/check/:bookId', authMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT r.*, (SELECT COUNT(*) FROM reservations r2 WHERE r2.book_id = r.book_id AND r2.status IN ('Active', 'Notified') AND r2.id < r.id) + 1 as current_position FROM reservations r WHERE r.user_id = ? AND r.book_id = ? AND r.status IN ('Active', 'Notified')",
      [req.user.id, req.params.bookId]
    );
    if (rows.length > 0) {
      res.json({ reserved: true, reservation: rows[0] });
    } else {
      res.json({ reserved: false });
    }
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

// DELETE /api/reservations/:id - Cancel reservation
router.delete('/:id', authMiddleware, async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const [res2] = await conn.query(
      "SELECT * FROM reservations WHERE id = ? AND user_id = ? AND status IN ('Active', 'Notified')",
      [req.params.id, req.user.id]
    );
    if (res2.length === 0) return res.status(404).json({ error: 'Reservation not found.' });

    await conn.beginTransaction();

    await conn.query("UPDATE reservations SET status = 'Cancelled' WHERE id = ?", [req.params.id]);

    // Recalculate positions for remaining reservations
    await recalculatePositions(conn, res2[0].book_id);

    await conn.commit();
    res.json({ message: 'Reservation cancelled.' });
  } catch (err) {
    await conn.rollback();
    console.error('Cancel reservation error:', err);
    res.status(500).json({ error: 'Server error.' });
  } finally {
    conn.release();
  }
});

// GET /api/reservations/popular - Highly requested books
router.get('/popular', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT b.*, COUNT(r.id) as reservation_count, b.issued_count
      FROM books b
      JOIN reservations r ON b.id = r.book_id AND r.status IN ('Active', 'Notified')
      GROUP BY b.id
      ORDER BY reservation_count DESC
      LIMIT 5
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

// GET /api/reservations/all - Admin: All reservations
router.get('/all', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { status, book_id } = req.query;
    let where = [];
    let params = [];

    if (status && status !== 'All') {
      where.push('r.status = ?');
      params.push(status);
    }
    if (book_id) {
      where.push('r.book_id = ?');
      params.push(book_id);
    }

    const whereClause = where.length > 0 ? 'WHERE ' + where.join(' AND ') : '';

    const [rows] = await pool.query(`
      SELECT r.*, b.title, b.author, b.cover_url, b.quantity, b.issued_count,
             u.name as user_name, u.usn, u.email,
        (SELECT COUNT(*) FROM reservations r2 
         WHERE r2.book_id = r.book_id AND r2.status IN ('Active', 'Notified') AND r2.id < r.id) + 1 as current_position,
        (SELECT COUNT(*) FROM reservations r3 
         WHERE r3.book_id = r.book_id AND r3.status IN ('Active', 'Notified')) as total_in_queue
      FROM reservations r
      JOIN books b ON r.book_id = b.id
      JOIN users u ON r.user_id = u.id
      ${whereClause}
      ORDER BY r.created_at DESC
    `, params);
    res.json(rows);
  } catch (err) {
    console.error('Admin get reservations error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// PUT /api/reservations/:id/cancel - Admin: Cancel any reservation
router.put('/:id/cancel', authMiddleware, adminOnly, async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const [reservation] = await conn.query(
      "SELECT * FROM reservations WHERE id = ? AND status IN ('Active', 'Notified')",
      [req.params.id]
    );
    if (reservation.length === 0) return res.status(404).json({ error: 'Reservation not found.' });

    await conn.beginTransaction();
    await conn.query("UPDATE reservations SET status = 'Cancelled' WHERE id = ?", [req.params.id]);
    await recalculatePositions(conn, reservation[0].book_id);
    await conn.commit();

    res.json({ message: 'Reservation cancelled by admin.' });
  } catch (err) {
    await conn.rollback();
    console.error('Admin cancel reservation error:', err);
    res.status(500).json({ error: 'Server error.' });
  } finally {
    conn.release();
  }
});

export default router;
