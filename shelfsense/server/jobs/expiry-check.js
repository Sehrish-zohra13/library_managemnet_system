import pool from '../config/db.js';

const EXPIRY_CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutes

/**
 * Expires notified reservations past their expiry window,
 * then promotes the next person in queue for each affected book.
 */
async function checkExpiredReservations() {
  const conn = await pool.getConnection();
  try {
    // 1. Find all expired-but-still-notified reservations
    const [expired] = await conn.query(
      "SELECT * FROM reservations WHERE status = 'Notified' AND expires_at IS NOT NULL AND expires_at < NOW()"
    );

    if (expired.length === 0) return;

    await conn.beginTransaction();

    const affectedBookIds = new Set();

    for (const res of expired) {
      // Mark as expired
      await conn.query(
        "UPDATE reservations SET status = 'Expired' WHERE id = ?",
        [res.id]
      );
      affectedBookIds.add(res.book_id);
    }

    // 2. For each affected book, promote the next person in queue
    for (const bookId of affectedBookIds) {
      await promoteNextInQueue(conn, bookId);
    }

    await conn.commit();

    if (expired.length > 0) {
      console.log(`⏰ Expired ${expired.length} reservation(s), promoted next in queue.`);
    }
  } catch (err) {
    await conn.rollback();
    console.error('Expiry check error:', err);
  } finally {
    conn.release();
  }
}

/**
 * Promotes the next Active reservation in queue for a book to Notified status.
 * Only promotes if the book actually has available copies.
 */
export async function promoteNextInQueue(conn, bookId) {
  // Check if book has available copies
  const [book] = await conn.query(
    'SELECT quantity, issued_count FROM books WHERE id = ?',
    [bookId]
  );
  if (book.length === 0) return null;
  if (book[0].quantity - book[0].issued_count <= 0) return null;

  // Find the next Active reservation (first-come-first-serve by creation time)
  const [next] = await conn.query(
    "SELECT * FROM reservations WHERE book_id = ? AND status = 'Active' ORDER BY created_at ASC LIMIT 1",
    [bookId]
  );

  if (next.length === 0) return null;

  // Promote to Notified with 24-hour expiry
  await conn.query(
    "UPDATE reservations SET status = 'Notified', notified_at = NOW(), expires_at = DATE_ADD(NOW(), INTERVAL 24 HOUR) WHERE id = ?",
    [next[0].id]
  );

  console.log(`📬 Notified user ${next[0].user_id} for book ${bookId} (reservation #${next[0].id})`);
  return next[0];
}

/**
 * Recalculates queue positions for all active reservations of a book.
 */
export async function recalculatePositions(conn, bookId) {
  const [remaining] = await conn.query(
    "SELECT id FROM reservations WHERE book_id = ? AND status = 'Active' ORDER BY created_at ASC",
    [bookId]
  );
  for (let i = 0; i < remaining.length; i++) {
    await conn.query('UPDATE reservations SET position = ? WHERE id = ?', [i + 1, remaining[i].id]);
  }
}

export function startExpiryCheck() {
  // Run immediately on startup
  checkExpiredReservations();
  // Then run periodically
  const intervalId = setInterval(checkExpiredReservations, EXPIRY_CHECK_INTERVAL);
  console.log('⏰ Reservation expiry checker started (every 5 min)');
  return intervalId;
}
