import express from 'express';
import pool from '../config/db.js';
import { authMiddleware } from '../middleware/auth.js';
import { promoteNextInQueue } from '../jobs/expiry-check.js';

const router = express.Router();

// POST /api/issues/issue - Issue a book
router.post('/issue', authMiddleware, async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const { book_id } = req.body;
    const user_id = req.user.id;

    // Check borrow limit
    const [activeIssues] = await conn.query(
      "SELECT COUNT(*) as count FROM issues WHERE user_id = ? AND status = 'Issued'",
      [user_id]
    );
    const [userRow] = await conn.query('SELECT borrow_limit FROM users WHERE id = ?', [user_id]);
    if (activeIssues[0].count >= (userRow[0]?.borrow_limit || 3)) {
      return res.status(400).json({ error: 'Borrow limit reached.' });
    }

    // Check availability
    const [book] = await conn.query('SELECT * FROM books WHERE id = ?', [book_id]);
    if (book.length === 0) return res.status(404).json({ error: 'Book not found.' });
    if (book[0].quantity - book[0].issued_count <= 0) {
      return res.status(400).json({ error: 'No copies available.' });
    }

    // Check if already issued
    const [existing] = await conn.query(
      "SELECT * FROM issues WHERE user_id = ? AND book_id = ? AND status = 'Issued'",
      [user_id, book_id]
    );
    if (existing.length > 0) {
      return res.status(400).json({ error: 'You already have this book issued.' });
    }

    await conn.beginTransaction();

    const issueDate = new Date();
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 14);
    const txId = 'TX-' + Math.floor(100000 + Math.random() * 900000);

    await conn.query(
      `INSERT INTO issues (user_id, book_id, issue_date, due_date, status, transaction_id)
       VALUES (?, ?, ?, ?, 'Issued', ?)`,
      [user_id, book_id, issueDate.toISOString().slice(0, 10), dueDate.toISOString().slice(0, 10), txId]
    );

    await conn.query('UPDATE books SET issued_count = issued_count + 1 WHERE id = ?', [book_id]);

    // Fulfill reservation if exists
    await conn.query(
      "UPDATE reservations SET status = 'Fulfilled' WHERE user_id = ? AND book_id = ? AND status = 'Active'",
      [user_id, book_id]
    );

    await conn.commit();

    const [issue] = await conn.query(`
      SELECT i.*, b.title, b.author, b.floor_num, b.row_num, b.rack_num, b.isbn, b.cover_url
      FROM issues i JOIN books b ON i.book_id = b.id
      WHERE i.transaction_id = ?
    `, [txId]);

    res.status(201).json(issue[0]);
  } catch (err) {
    await conn.rollback();
    console.error('Issue error:', err);
    res.status(500).json({ error: 'Server error.' });
  } finally {
    conn.release();
  }
});

// POST /api/issues/return/:id - Return a book
router.post('/return/:id', authMiddleware, async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const [issue] = await conn.query('SELECT * FROM issues WHERE id = ? AND user_id = ?', [
      req.params.id,
      req.user.id,
    ]);
    if (issue.length === 0) return res.status(404).json({ error: 'Issue not found.' });
    if (issue[0].status === 'Returned') return res.status(400).json({ error: 'Already returned.' });

    await conn.beginTransaction();

    const returnDate = new Date();
    const dueDate = new Date(issue[0].due_date);
    let fine = 0;

    if (returnDate > dueDate) {
      const daysLate = Math.ceil((returnDate - dueDate) / (1000 * 60 * 60 * 24));
      fine = daysLate * 2.50;
    }

    await conn.query(
      "UPDATE issues SET status = 'Returned', return_date = ?, fine = ? WHERE id = ?",
      [returnDate.toISOString().slice(0, 10), fine, req.params.id]
    );

    await conn.query('UPDATE books SET issued_count = GREATEST(issued_count - 1, 0) WHERE id = ?', [
      issue[0].book_id,
    ]);

    // Promote next person in reservation queue for this book
    await promoteNextInQueue(conn, issue[0].book_id);

    await conn.commit();

    res.json({ message: 'Book returned successfully.', fine });
  } catch (err) {
    await conn.rollback();
    console.error('Return error:', err);
    res.status(500).json({ error: 'Server error.' });
  } finally {
    conn.release();
  }
});

// GET /api/issues/my - User's issues
router.get('/my', authMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT i.*, b.title, b.author, b.category, b.floor_num, b.row_num, b.rack_num, b.isbn, b.cover_url
      FROM issues i
      JOIN books b ON i.book_id = b.id
      WHERE i.user_id = ?
      ORDER BY i.created_at DESC
    `, [req.user.id]);

    // Auto-update overdue statuses
    const today = new Date();
    for (const issue of rows) {
      if (issue.status === 'Issued' && new Date(issue.due_date) < today) {
        const daysLate = Math.ceil((today - new Date(issue.due_date)) / (1000 * 60 * 60 * 24));
        const fine = daysLate * 2.50;
        await pool.query("UPDATE issues SET status = 'Overdue', fine = ? WHERE id = ?", [fine, issue.id]);
        issue.status = 'Overdue';
        issue.fine = fine;
      }
    }

    res.json(rows);
  } catch (err) {
    console.error('Get my issues error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// GET /api/issues/all - Admin: All issues
router.get('/all', authMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT i.*, b.title, b.author, b.cover_url, u.name as user_name, u.usn
      FROM issues i
      JOIN books b ON i.book_id = b.id
      JOIN users u ON i.user_id = u.id
      ORDER BY i.created_at DESC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

// GET /api/issues/activity - Recent activity for charts
router.get('/activity', authMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT DATE(issue_date) as date, COUNT(*) as count
      FROM issues
      WHERE issue_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
      GROUP BY DATE(issue_date)
      ORDER BY date
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

export default router;
