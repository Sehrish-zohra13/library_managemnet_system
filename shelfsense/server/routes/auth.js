import express from 'express';
import bcrypt from 'bcryptjs';
import pool from '../config/db.js';
import { generateToken, authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, usn, password } = req.body;
    if (!password || (!email && !usn)) {
      return res.status(400).json({ error: 'Please provide email/USN and password.' });
    }

    let query, param;
    if (email) {
      query = 'SELECT * FROM users WHERE email = ?';
      param = email;
    } else {
      query = 'SELECT * FROM users WHERE usn = ?';
      param = usn;
    }

    const [rows] = await pool.query(query, [param]);
    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    const user = rows[0];
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    const token = generateToken(user);
    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        usn: user.usn,
        role: user.role,
        department: user.department,
        borrow_limit: user.borrow_limit,
        avatar_url: user.avatar_url,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, usn, password, department } = req.body;
    if (!name || !password || (!email && !usn)) {
      return res.status(400).json({ error: 'Name, password, and email/USN required.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      'INSERT INTO users (name, email, usn, password, role, department) VALUES (?, ?, ?, ?, ?, ?)',
      [name, email || null, usn || null, hashedPassword, 'Student', department || null]
    );

    const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [result.insertId]);
    const user = rows[0];
    const token = generateToken(user);

    res.status(201).json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        usn: user.usn,
        role: user.role,
        department: user.department,
        borrow_limit: user.borrow_limit,
      },
    });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Email or USN already exists.' });
    }
    console.error('Register error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// GET /api/auth/me
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, name, email, usn, role, department, borrow_limit, avatar_url, created_at FROM users WHERE id = ?',
      [req.user.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'User not found.' });
    res.json(rows[0]);
  } catch (err) {
    console.error('Get me error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// PUT /api/auth/profile
router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const { name, department } = req.body;
    await pool.query('UPDATE users SET name = ?, department = ? WHERE id = ?', [
      name || req.user.name,
      department,
      req.user.id,
    ]);
    const [rows] = await pool.query(
      'SELECT id, name, email, usn, role, department, borrow_limit, avatar_url FROM users WHERE id = ?',
      [req.user.id]
    );
    res.json(rows[0]);
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

export default router;
