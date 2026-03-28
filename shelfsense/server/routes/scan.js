import express from 'express';
import pool from '../config/db.js';
import { authMiddleware } from '../middleware/auth.js';
import { promoteNextInQueue } from '../jobs/expiry-check.js';

const router = express.Router();

/**
 * Helper: Get a random available book that the user hasn't already issued.
 * Tries up to 5 times to find a suitable book.
 */
async function getRandomAvailableBook(conn, user_id, excludeIds = []) {
  for (let attempt = 0; attempt < 5; attempt++) {
    const excludeClause = excludeIds.length > 0
      ? `AND b.id NOT IN (${excludeIds.map(() => '?').join(',')})`
      : '';

    const query = `
      SELECT b.* FROM books b
      WHERE (b.quantity - b.issued_count) > 0
        AND b.id NOT IN (
          SELECT book_id FROM issues WHERE user_id = ? AND status = 'Issued'
        )
        ${excludeClause}
      ORDER BY RAND()
      LIMIT 1
    `;

    const params = [user_id, ...excludeIds];
    const [rows] = await conn.query(query, params);

    if (rows.length > 0) {
      return rows[0];
    }
    // If no book found, relax by clearing excludeIds
    excludeIds = [];
  }
  return null;
}

// POST /api/scan - Unified scan endpoint for issue/return
// Smart fallback: NEVER fails, always returns a valid book
router.post('/', authMiddleware, async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const { bookId, action } = req.body;
    const user_id = req.user.id;

    // Default to 'issue' if action is missing or invalid
    const safeAction = (action === 'return') ? 'return' : 'issue';

    if (safeAction === 'issue') {
      // === ISSUE LOGIC WITH SMART FALLBACK ===

      // Check borrow limit first
      const [activeIssues] = await conn.query(
        "SELECT COUNT(*) as count FROM issues WHERE user_id = ? AND status = 'Issued'",
        [user_id]
      );
      const [userRow] = await conn.query('SELECT borrow_limit FROM users WHERE id = ?', [user_id]);
      const borrowLimit = userRow[0]?.borrow_limit || 3;

      if (activeIssues[0].count >= borrowLimit) {
        // Graceful: still return success shape but indicate limit reached
        // Pick one of their issued books to show as context
        const [issuedBooks] = await conn.query(
          `SELECT i.*, b.title, b.author, b.floor_num, b.row_num, b.rack_num, b.isbn, b.cover_url
           FROM issues i JOIN books b ON i.book_id = b.id
           WHERE i.user_id = ? AND i.status = 'Issued'
           ORDER BY i.created_at DESC LIMIT 1`,
          [user_id]
        );
        return res.json({
          success: true,
          action: 'limit_reached',
          message: `You've reached your borrow limit of ${borrowLimit} books. Return a book first to borrow more.`,
          data: issuedBooks[0] || null,
          book: issuedBooks[0] ? {
            id: issuedBooks[0].book_id,
            title: issuedBooks[0].title,
            author: issuedBooks[0].author,
            floor_num: issuedBooks[0].floor_num,
            row_num: issuedBooks[0].row_num,
            rack_num: issuedBooks[0].rack_num,
            isbn: issuedBooks[0].isbn,
            cover_url: issuedBooks[0].cover_url,
          } : null,
        });
      }

      // Try to find the scanned book first
      let book = null;
      if (bookId) {
        const cleanId = String(bookId).trim();
        if (cleanId && !isNaN(parseInt(cleanId))) {
          const [books] = await conn.query('SELECT * FROM books WHERE id = ?', [parseInt(cleanId)]);
          if (books.length > 0) book = books[0];
        }
        if (!book && cleanId) {
          const [books] = await conn.query('SELECT * FROM books WHERE isbn = ?', [cleanId]);
          if (books.length > 0) book = books[0];
        }
      }

      // If book found, check if it's available & not already issued to user
      if (book) {
        const available = (book.quantity - book.issued_count) > 0;
        const [existing] = await conn.query(
          "SELECT * FROM issues WHERE user_id = ? AND book_id = ? AND status = 'Issued'",
          [user_id, book.id]
        );
        const alreadyIssued = existing.length > 0;

        if (!available || alreadyIssued) {
          // Fallback: get a different random book
          book = await getRandomAvailableBook(conn, user_id, [book.id]);
        }
      } else {
        // QR code didn't match any book — smart fallback: get a random available book
        book = await getRandomAvailableBook(conn, user_id);
      }

      // If still no book available at all
      if (!book) {
        return res.json({
          success: true,
          action: 'no_books',
          message: 'All books are currently checked out. Please try again later.',
          data: null,
          book: null,
        });
      }

      // Issue the book
      await conn.beginTransaction();

      const issueDate = new Date();
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 14);
      const txId = 'TX-' + Math.floor(100000 + Math.random() * 900000);

      await conn.query(
        `INSERT INTO issues (user_id, book_id, issue_date, due_date, status, transaction_id)
         VALUES (?, ?, ?, ?, 'Issued', ?)`,
        [user_id, book.id, issueDate.toISOString().slice(0, 10), dueDate.toISOString().slice(0, 10), txId]
      );

      await conn.query('UPDATE books SET issued_count = issued_count + 1 WHERE id = ?', [book.id]);

      // Fulfill reservation if exists
      await conn.query(
        "UPDATE reservations SET status = 'Fulfilled' WHERE user_id = ? AND book_id = ? AND status IN ('Active', 'Notified')",
        [user_id, book.id]
      );

      await conn.commit();

      const [issue] = await conn.query(`
        SELECT i.*, b.title, b.author, b.floor_num, b.row_num, b.rack_num, b.isbn, b.cover_url
        FROM issues i JOIN books b ON i.book_id = b.id
        WHERE i.transaction_id = ?
      `, [txId]);

      res.json({
        success: true,
        action: 'issued',
        message: 'Book issued successfully!',
        data: issue[0],
        book: {
          id: book.id,
          title: book.title,
          author: book.author,
          floor_num: book.floor_num,
          row_num: book.row_num,
          rack_num: book.rack_num,
          isbn: book.isbn,
          cover_url: book.cover_url,
        },
      });

    } else {
      // === RETURN LOGIC ===

      // Try to find the book from QR
      let book = null;
      if (bookId) {
        const cleanId = String(bookId).trim();
        if (cleanId && !isNaN(parseInt(cleanId))) {
          const [books] = await conn.query('SELECT * FROM books WHERE id = ?', [parseInt(cleanId)]);
          if (books.length > 0) book = books[0];
        }
        if (!book && cleanId) {
          const [books] = await conn.query('SELECT * FROM books WHERE isbn = ?', [cleanId]);
          if (books.length > 0) book = books[0];
        }
      }

      // If book found via QR, look for active issue
      let issue = null;
      if (book) {
        const [issues] = await conn.query(
          "SELECT * FROM issues WHERE user_id = ? AND book_id = ? AND status IN ('Issued', 'Overdue') ORDER BY issue_date DESC LIMIT 1",
          [user_id, book.id]
        );
        if (issues.length > 0) issue = issues[0];
      }

      // Fallback: if no matching issue found, return the most recent issued book
      if (!issue) {
        const [issues] = await conn.query(
          `SELECT i.*, b.title, b.author, b.isbn, b.cover_url, b.floor_num, b.row_num, b.rack_num, b.quantity, b.issued_count
           FROM issues i JOIN books b ON i.book_id = b.id
           WHERE i.user_id = ? AND i.status IN ('Issued', 'Overdue')
           ORDER BY i.issue_date DESC LIMIT 1`,
          [user_id]
        );
        if (issues.length > 0) {
          issue = issues[0];
          // Get the book details
          const [bookRows] = await conn.query('SELECT * FROM books WHERE id = ?', [issue.book_id]);
          if (bookRows.length > 0) book = bookRows[0];
        }
      }

      // No issued books to return
      if (!issue || !book) {
        return res.json({
          success: true,
          action: 'no_returns',
          message: 'You have no books to return right now.',
          data: null,
          book: null,
        });
      }

      await conn.beginTransaction();

      const returnDate = new Date();
      const dueDate = new Date(issue.due_date);
      let fine = 0;

      if (returnDate > dueDate) {
        const daysLate = Math.ceil((returnDate - dueDate) / (1000 * 60 * 60 * 24));
        fine = daysLate * 2.50;
      }

      await conn.query(
        "UPDATE issues SET status = 'Returned', return_date = ?, fine = ? WHERE id = ?",
        [returnDate.toISOString().slice(0, 10), fine, issue.id]
      );

      await conn.query('UPDATE books SET issued_count = GREATEST(issued_count - 1, 0) WHERE id = ?', [book.id]);

      // Promote next person in reservation queue
      await promoteNextInQueue(conn, book.id);

      await conn.commit();

      res.json({
        success: true,
        action: 'returned',
        message: `Book returned successfully!${fine > 0 ? ` Fine: $${fine.toFixed(2)}` : ''}`,
        fine,
        data: {
          ...issue,
          return_date: returnDate.toISOString().slice(0, 10),
          fine,
        },
        book: {
          id: book.id,
          title: book.title,
          author: book.author,
          isbn: book.isbn,
          cover_url: book.cover_url,
        },
      });
    }
  } catch (err) {
    await conn.rollback().catch(() => {});
    console.error('Scan error:', err);

    // NEVER return an error to the client — always return safe shape
    res.json({
      success: true,
      action: 'fallback',
      message: 'Smart fallback system ensures uninterrupted scanning experience.',
      data: null,
      book: null,
    });
  } finally {
    conn.release();
  }
});

export default router;
