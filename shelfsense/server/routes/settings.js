import express from 'express';
import bcrypt from 'bcryptjs';
import pool from '../config/db.js';
import { authMiddleware, adminOnly } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// PUT /api/settings/password - Change password
router.put('/password', async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) {
      return res.status(400).json({ error: 'Old and new passwords are required.' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters.' });
    }

    const [rows] = await pool.query('SELECT password FROM users WHERE id = ?', [req.user.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'User not found.' });

    const validOld = await bcrypt.compare(oldPassword, rows[0].password);
    if (!validOld) {
      return res.status(401).json({ error: 'Current password is incorrect.' });
    }

    const hashedNew = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE users SET password = ? WHERE id = ?', [hashedNew, req.user.id]);

    res.json({ message: 'Password updated successfully.' });
  } catch (err) {
    console.error('Change password error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// GET /api/settings/admin - Get admin settings (fine rate, default borrow limit)
router.get('/admin', adminOnly, async (req, res) => {
  try {
    // We'll store admin settings in a simple key-value approach
    // For now, return defaults or from a settings table concept
    const [rows] = await pool.query(
      "SELECT * FROM admin_settings WHERE id = 1"
    ).catch(() => [[]]); // If table doesn't exist yet

    if (rows.length > 0) {
      res.json(rows[0]);
    } else {
      res.json({
        default_borrow_limit: 3,
        fine_per_day: 2.50,
      });
    }
  } catch (err) {
    // Return defaults if table doesn't exist
    res.json({
      default_borrow_limit: 3,
      fine_per_day: 2.50,
    });
  }
});

// PUT /api/settings/admin - Update admin settings
router.put('/admin', adminOnly, async (req, res) => {
  try {
    const { default_borrow_limit, fine_per_day } = req.body;

    // Create the table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS admin_settings (
        id INT PRIMARY KEY DEFAULT 1,
        default_borrow_limit INT DEFAULT 3,
        fine_per_day DECIMAL(10, 2) DEFAULT 2.50,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Upsert
    await pool.query(`
      INSERT INTO admin_settings (id, default_borrow_limit, fine_per_day)
      VALUES (1, ?, ?)
      ON DUPLICATE KEY UPDATE default_borrow_limit = VALUES(default_borrow_limit), fine_per_day = VALUES(fine_per_day)
    `, [default_borrow_limit || 3, fine_per_day || 2.50]);

    // Optionally update all students' borrow limits
    if (default_borrow_limit) {
      await pool.query(
        "UPDATE users SET borrow_limit = ? WHERE role = 'Student'",
        [default_borrow_limit]
      );
    }

    res.json({
      message: 'Admin settings updated.',
      default_borrow_limit: default_borrow_limit || 3,
      fine_per_day: fine_per_day || 2.50,
    });
  } catch (err) {
    console.error('Admin settings error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// GET /api/settings/borrowing - Get current borrowing info for user
router.get('/borrowing', async (req, res) => {
  try {
    const [userRows] = await pool.query(
      'SELECT borrow_limit FROM users WHERE id = ?',
      [req.user.id]
    );
    const [issueRows] = await pool.query(
      "SELECT COUNT(*) as current_borrowed FROM issues WHERE user_id = ? AND status IN ('Issued', 'Overdue')",
      [req.user.id]
    );

    res.json({
      borrow_limit: userRows[0]?.borrow_limit || 3,
      current_borrowed: issueRows[0]?.current_borrowed || 0,
    });
  } catch (err) {
    console.error('Borrowing info error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

export default router;
