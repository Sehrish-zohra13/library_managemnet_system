import express from 'express';
import pool from '../config/db.js';
import { authMiddleware, adminOnly } from '../middleware/auth.js';

const router = express.Router();

// GET /api/admin/stats
router.get('/stats', authMiddleware, adminOnly, async (req, res) => {
  try {
    const [books] = await pool.query('SELECT COUNT(*) as titles, SUM(quantity) as total, SUM(issued_count) as issued FROM books');
    const [overdue] = await pool.query("SELECT COUNT(*) as count FROM issues WHERE status = 'Overdue'");
    const [activeLoans] = await pool.query("SELECT COUNT(*) as count FROM issues WHERE status = 'Issued' OR status = 'Overdue'");
    const [pendingRequests] = await pool.query("SELECT COUNT(*) as count FROM fine_requests WHERE status = 'Pending'");
    const [students] = await pool.query("SELECT COUNT(*) as count FROM users WHERE role = 'Student'");
    const [activeReservations] = await pool.query("SELECT COUNT(*) as count FROM reservations WHERE status IN ('Active', 'Notified')");

    res.json({
      totalTitles: books[0].titles || 0,
      totalBooks: books[0].total || 0,
      issuedBooks: books[0].issued || 0,
      overdueBooks: overdue[0].count || 0,
      activeLoans: activeLoans[0].count || 0,
      pendingRequests: pendingRequests[0].count || 0,
      totalStudents: students[0].count || 0,
      activeReservations: activeReservations[0].count || 0,
    });
  } catch (err) {
    console.error('Admin stats error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// GET /api/admin/analytics
router.get('/analytics', authMiddleware, adminOnly, async (req, res) => {
  try {
    // Most borrowed books
    const [popular] = await pool.query(`
      SELECT b.title, b.author, COUNT(i.id) as borrow_count
      FROM books b
      JOIN issues i ON b.id = i.book_id
      GROUP BY b.id
      ORDER BY borrow_count DESC
      LIMIT 10
    `);

    // Category distribution
    const [categories] = await pool.query(`
      SELECT category, COUNT(*) as count FROM books GROUP BY category ORDER BY count DESC
    `);

    // Monthly trends
    const [monthly] = await pool.query(`
      SELECT DATE_FORMAT(issue_date, '%Y-%m') as month, COUNT(*) as count
      FROM issues
      WHERE issue_date >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
      GROUP BY month
      ORDER BY month
    `);

    // Daily activity (last 7 days)
    const [daily] = await pool.query(`
      SELECT DAYNAME(issue_date) as day, COUNT(*) as count
      FROM issues
      WHERE issue_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
      GROUP BY day
      ORDER BY FIELD(day, 'Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday')
    `);

    res.json({ popular, categories, monthly, daily });
  } catch (err) {
    console.error('Analytics error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// GET /api/admin/recent-activity
router.get('/recent-activity', authMiddleware, adminOnly, async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT i.*, b.title, b.author, u.name as user_name,
             b.floor_num, b.row_num, b.rack_num
      FROM issues i
      JOIN books b ON i.book_id = b.id
      JOIN users u ON i.user_id = u.id
      ORDER BY i.created_at DESC
      LIMIT 20
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

// GET /api/admin/users
router.get('/users', authMiddleware, adminOnly, async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT u.id, u.name, u.email, u.usn, u.role, u.department, u.created_at,
        (SELECT COUNT(*) FROM issues i WHERE i.user_id = u.id AND i.status = 'Issued') as active_issues,
        (SELECT SUM(fine) FROM issues i WHERE i.user_id = u.id AND fine > 0) as total_fines
      FROM users u
      ORDER BY u.created_at DESC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

export default router;
