import express from 'express';
import pool from '../config/db.js';
import { authMiddleware, adminOnly } from '../middleware/auth.js';

const router = express.Router();

// GET /api/fines/my - User's fines (with waiver request status)
router.get('/my', authMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT i.*, b.title, b.author, b.cover_url,
             fr.id as waiver_id, fr.status as waiver_status, fr.reason as waiver_reason,
             fr.admin_note, fr.created_at as waiver_date
      FROM issues i
      JOIN books b ON i.book_id = b.id
      LEFT JOIN fine_requests fr ON fr.issue_id = i.id AND fr.user_id = i.user_id
        AND fr.id = (SELECT MAX(fr2.id) FROM fine_requests fr2 WHERE fr2.issue_id = i.id AND fr2.user_id = i.user_id)
      WHERE i.user_id = ? AND i.fine > 0
      ORDER BY i.fine DESC
    `, [req.user.id]);

    const [total] = await pool.query(
      "SELECT SUM(fine) as total FROM issues WHERE user_id = ? AND fine > 0 AND status != 'Returned'",
      [req.user.id]
    );

    res.json({
      fines: rows,
      totalFine: total[0].total || 0,
    });
  } catch (err) {
    console.error('Get fines error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// GET /api/fines/my-requests - User's waiver request history
router.get('/my-requests', authMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT fr.*, b.title as book_title, b.author as book_author,
             i.issue_date, i.due_date, i.fine as current_fine
      FROM fine_requests fr
      JOIN issues i ON fr.issue_id = i.id
      JOIN books b ON i.book_id = b.id
      WHERE fr.user_id = ?
      ORDER BY fr.created_at DESC
    `, [req.user.id]);
    res.json(rows);
  } catch (err) {
    console.error('Get my requests error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// POST /api/fines/request - Submit fine waiver request
router.post('/request', authMiddleware, async (req, res) => {
  try {
    const { issue_id, reason } = req.body;
    if (!issue_id || !reason) {
      return res.status(400).json({ error: 'Issue ID and reason required.' });
    }

    const [issue] = await pool.query('SELECT * FROM issues WHERE id = ? AND user_id = ?', [
      issue_id,
      req.user.id,
    ]);
    if (issue.length === 0) return res.status(404).json({ error: 'Issue not found.' });
    if (issue[0].fine <= 0) return res.status(400).json({ error: 'No fine on this issue.' });

    // Check for existing pending request
    const [existing] = await pool.query(
      "SELECT * FROM fine_requests WHERE issue_id = ? AND user_id = ? AND status = 'Pending'",
      [issue_id, req.user.id]
    );
    if (existing.length > 0) {
      return res.status(400).json({ error: 'Request already pending.' });
    }

    await pool.query(
      'INSERT INTO fine_requests (user_id, issue_id, reason, amount, status) VALUES (?, ?, ?, ?, ?)',
      [req.user.id, issue_id, reason, issue[0].fine, 'Pending']
    );

    res.status(201).json({ message: 'Fine waiver request submitted.' });
  } catch (err) {
    console.error('Fine request error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// GET /api/fines/requests - Admin: All fine requests
router.get('/requests', authMiddleware, adminOnly, async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT fr.*, u.name as user_name, u.usn, b.title as book_title,
             i.issue_date, i.due_date, i.fine
      FROM fine_requests fr
      JOIN users u ON fr.user_id = u.id
      JOIN issues i ON fr.issue_id = i.id
      JOIN books b ON i.book_id = b.id
      ORDER BY fr.created_at DESC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

// PUT /api/fines/requests/:id - Admin: Approve/reject
router.put('/requests/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { status, admin_note } = req.body;
    if (!['Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({ error: 'Status must be Approved or Rejected.' });
    }

    const [request] = await pool.query('SELECT * FROM fine_requests WHERE id = ?', [req.params.id]);
    if (request.length === 0) return res.status(404).json({ error: 'Request not found.' });
    if (request[0].status !== 'Pending') {
      return res.status(400).json({ error: 'Request already processed.' });
    }

    await pool.query(
      'UPDATE fine_requests SET status = ?, admin_note = ? WHERE id = ?',
      [status, admin_note || null, req.params.id]
    );

    if (status === 'Approved') {
      await pool.query('UPDATE issues SET fine = 0 WHERE id = ?', [request[0].issue_id]);
    }

    res.json({ message: `Request ${status.toLowerCase()}.` });
  } catch (err) {
    console.error('Fine request update error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

export default router;
