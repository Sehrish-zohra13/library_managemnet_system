import pool from './config/db.js';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
dotenv.config();

async function seed() {
  const conn = await pool.getConnection();
  try {
    console.log('🌱 Seeding ShelfSense database...\n');

    // Hash passwords
    const adminPass = await bcrypt.hash('admin123', 10);
    const studentPass = await bcrypt.hash('student123', 10);
    const sehrishPass = await bcrypt.hash('sehrish123', 10);

    // Clear existing data (order matters due to FK constraints)
    await conn.query(`DELETE FROM fine_requests`);
    await conn.query(`DELETE FROM reservations`);
    await conn.query(`DELETE FROM issues`);
    await conn.query(`DELETE FROM books`);
    await conn.query(`DELETE FROM users`);

    // Reset AUTO_INCREMENT
    await conn.query(`ALTER TABLE users AUTO_INCREMENT = 1`);
    await conn.query(`ALTER TABLE books AUTO_INCREMENT = 1`);
    await conn.query(`ALTER TABLE issues AUTO_INCREMENT = 1`);
    await conn.query(`ALTER TABLE reservations AUTO_INCREMENT = 1`);
    await conn.query(`ALTER TABLE fine_requests AUTO_INCREMENT = 1`);

    // Insert Users — IDs will be 1-8
    await conn.query(`
      INSERT INTO users (name, email, usn, password, role, department) VALUES
      ('Sehrish Zohra', 'sehrish@shelfsense.io', NULL, ?, 'Admin', 'Administration'),
      ('Dr. Aris Thorne', 'aris@shelfsense.io', NULL, ?, 'Admin', 'Library Sciences'),
      ('Alex Rivera', 'alex@university.edu', '1RV22CS001', ?, 'Student', 'Computer Science'),
      ('Marcus Thorne', 'marcus@university.edu', '1RV22CS002', ?, 'Student', 'Computer Science'),
      ('Elena Vance', 'elena@university.edu', '1RV22EC003', ?, 'Student', 'Electronics'),
      ('Julian Solis', 'julian@university.edu', '1RV22ME004', ?, 'Student', 'Mechanical'),
      ('Sarah Chen', 'sarah@university.edu', '1RV22IS005', ?, 'Student', 'Information Science'),
      ('Sehrish Zohra', 'navalgundsehrishzohra@gmail.com', '2TG24CS412', ?, 'Student', 'Computer Science')
    `, [sehrishPass, adminPass, studentPass, studentPass, studentPass, studentPass, studentPass, sehrishPass]);

    console.log('✅ Users seeded (8 users)');

    // Insert Books — IDs will be 1-25
    await conn.query(`
      INSERT INTO books (title, author, category, quantity, issued_count, floor_num, row_num, rack_num, isbn, year, description) VALUES
      ('The Shadow of the Wind', 'Carlos Ruiz Zafón', 'Historical Fiction', 5, 2, 2, 14, 9, '978-0143034902', 2001, 'A mystery set in post-war Barcelona about a boy who discovers a forgotten book.'),
      ('The Midnight Library', 'Matt Haig', 'Contemporary Fantasy', 3, 3, 1, 3, 22, '978-0525559474', 2020, 'Between life and death there is a library where you can try alternate lives.'),
      ('Dune', 'Frank Herbert', 'Sci-Fi Epic', 8, 3, 4, 1, 15, '978-0441172719', 1965, 'The epic saga of a desert planet and the boy destined to rule it.'),
      ('Circe', 'Madeline Miller', 'Greek Mythology', 4, 1, 2, 8, 11, '978-0316556347', 2018, 'The story of the mythological witch Circe, daughter of the Titan Helios.'),
      ('Neuromancer', 'William Gibson', 'Cyberpunk', 3, 2, 5, 12, 4, '978-0441569595', 1984, 'The seminal work of cyberpunk fiction about a washed-up hacker.'),
      ('Nevernight', 'Jay Kristoff', 'Dark Fantasy', 6, 1, 3, 5, 30, '978-1250073020', 2016, 'A girl training to become an assassin in a world with three suns.'),
      ('Design Systems', 'Alla Kholmatova', 'Technology', 4, 2, 1, 7, 18, '978-3945749586', 2017, 'A practical guide to creating design languages for digital products.'),
      ('Operating Systems', 'Andrew S. Tanenbaum', 'Computer Science', 10, 5, 2, 2, 5, '978-0133591620', 2014, 'Modern operating systems concepts and design principles.'),
      ('Advanced Algorithms', 'Thomas H. Cormen', 'Computer Science', 7, 3, 2, 3, 8, '978-0262033848', 2009, 'Comprehensive introduction to algorithms and data structures.'),
      ('The Pragmatic Programmer', 'David Thomas', 'Programming', 5, 2, 1, 6, 12, '978-0135957059', 2019, 'Your journey to mastery in software craftsmanship.'),
      ('Clean Architecture', 'Robert C. Martin', 'Programming', 4, 1, 3, 4, 20, '978-0134494166', 2017, 'A craftsmans guide to software structure and design.'),
      ('Digital Fortress', 'Dan Brown', 'Thriller', 6, 2, 4, 9, 14, '978-0312944926', 1998, 'A thriller about the NSA and a code-breaking machine.'),
      ('The Quantum World', 'Kenneth Ford', 'Physics', 3, 0, 5, 1, 7, '978-0674018327', 2004, 'An accessible introduction to quantum mechanics.'),
      ('Neural Networks & Deep Learning', 'Michael Nielsen', 'AI/ML', 5, 3, 1, 10, 3, '978-1530826605', 2015, 'A visual and interactive approach to neural networks.'),
      ('Designing Data-Intensive Apps', 'Martin Kleppmann', 'Technology', 4, 4, 2, 6, 16, '978-1449373320', 2017, 'The big ideas behind reliable and scalable data systems.'),
      ('The Art of Fugue', 'J.S. Bach (Analyses)', 'Music Theory', 2, 1, 3, 11, 25, '978-0486257587', 1952, 'Analysis of Bachs final masterwork.'),
      ('Foundations of Digital Ethics', 'Dr. Marcus Thorne', 'Philosophy', 3, 1, 4, 7, 19, '978-0198738923', 2021, 'Exploring ethical questions in the digital age.'),
      ('The Architecture of Silence', 'Elena Vane', 'Architecture', 2, 1, 1, 2, 12, '978-0262538473', 2023, 'How quiet spaces shape our experience of buildings.'),
      ('History of Byzantine Empire', 'John Julius Norwich', 'History', 4, 1, 5, 8, 21, '978-0299809256', 1997, 'A sweeping history of Byzantium from its founding to its fall.'),
      ('Quantum Sociology', 'Dr. Lena Hart', 'Social Science', 3, 2, 3, 9, 6, '978-0745656847', 2022, 'Applying quantum theory concepts to social phenomena.'),
      ('The Minimalist Mindset', 'Leo Babauta', 'Self-Help', 5, 3, 2, 5, 10, '978-1539404491', 2016, 'Finding clarity and purpose through simplicity.'),
      ('Shadow Architect', 'Leo Da Vinci', 'Architecture', 3, 0, 4, 3, 8, '978-0123456789', 2020, 'Modern architectural principles and shadow play.'),
      ('1984', 'George Orwell', 'Dystopian Fiction', 8, 4, 1, 1, 1, '978-0451524935', 1949, 'A chilling prophecy about the future of totalitarianism.'),
      ('The Great Gatsby', 'F. Scott Fitzgerald', 'Classic Fiction', 6, 2, 2, 4, 3, '978-0743273565', 1925, 'A portrait of the Jazz Age and the American Dream.'),
      ('Brave New World', 'Aldous Huxley', 'Dystopian Fiction', 5, 1, 3, 2, 7, '978-0060850524', 1932, 'A fantasy of the future that sheds light on the present.')
    `);

    console.log('✅ Books seeded (25 books)');

    // Insert sample issues (user IDs 3-7, book IDs 1-25)
    const today = new Date();
    const fmt = (d) => d.toISOString().slice(0, 10);
    const addDays = (d, n) => { const r = new Date(d); r.setDate(r.getDate() + n); return r; };

    await conn.query(`
      INSERT INTO issues (user_id, book_id, issue_date, due_date, return_date, fine, status, transaction_id) VALUES
      (3, 7, ?, ?, NULL, 0, 'Issued', 'TX-882910'),
      (3, 8, ?, ?, NULL, 5.00, 'Overdue', 'TX-882911'),
      (3, 9, ?, ?, ?, 0, 'Returned', 'TX-882900'),
      (4, 1, ?, ?, NULL, 0, 'Issued', 'TX-882912'),
      (4, 18, ?, ?, NULL, 0, 'Issued', 'TX-882913'),
      (5, 2, ?, ?, ?, 0, 'Returned', 'TX-882890'),
      (5, 17, ?, ?, NULL, 0, 'Issued', 'TX-882914'),
      (6, 8, ?, ?, NULL, 12.50, 'Overdue', 'TX-882915'),
      (7, 14, ?, ?, NULL, 0, 'Issued', 'TX-882916'),
      (7, 15, ?, ?, NULL, 3.00, 'Overdue', 'TX-882917')
    `, [
      fmt(addDays(today, -10)), fmt(addDays(today, 4)),
      fmt(addDays(today, -20)), fmt(addDays(today, -6)),
      fmt(addDays(today, -30)), fmt(addDays(today, -16)), fmt(addDays(today, -14)),
      fmt(addDays(today, -5)), fmt(addDays(today, 9)),
      fmt(addDays(today, -3)), fmt(addDays(today, 11)),
      fmt(addDays(today, -25)), fmt(addDays(today, -11)), fmt(addDays(today, -10)),
      fmt(addDays(today, -7)), fmt(addDays(today, 7)),
      fmt(addDays(today, -30)), fmt(addDays(today, -16)),
      fmt(addDays(today, -8)), fmt(addDays(today, 6)),
      fmt(addDays(today, -18)), fmt(addDays(today, -4))
    ]);

    console.log('✅ Issues seeded');

    // Insert sample reservations
    await conn.query(`
      INSERT INTO reservations (user_id, book_id, position, status) VALUES
      (3, 2, 2, 'Active'),
      (3, 15, 1, 'Active'),
      (5, 2, 3, 'Active'),
      (6, 14, 1, 'Active')
    `);

    console.log('✅ Reservations seeded');

    // Insert sample fine requests
    await conn.query(`
      INSERT INTO fine_requests (user_id, issue_id, reason, amount, status) VALUES
      (6, 8, 'Book was returned late due to campus-wide network outage. Proof attached in ticket #004.', 12.50, 'Pending'),
      (7, 10, 'Accidental double-booking error on the mobile application.', 3.00, 'Pending')
    `);

    console.log('✅ Fine requests seeded');
    console.log('\n🎉 Database seeded successfully!\n');
    console.log('╔══════════════════════════════════════════════════════════╗');
    console.log('║              📋 LOGIN CREDENTIALS                       ║');
    console.log('╠══════════════════════════════════════════════════════════╣');
    console.log('║  ADMIN LOGIN (select Admin role):                       ║');
    console.log('║    Email: sehrish@shelfsense.io                         ║');
    console.log('║    Password: sehrish123                                 ║');
    console.log('║                                                         ║');
    console.log('║  ADMIN LOGIN (alternate):                               ║');
    console.log('║    Email: aris@shelfsense.io                            ║');
    console.log('║    Password: admin123                                   ║');
    console.log('║                                                         ║');
    console.log('║  STUDENT LOGIN (select Student role):                   ║');
    console.log('║    USN: 1RV22CS001  /  Password: student123             ║');
    console.log('║    USN: 2TG24CS412  /  Password: sehrish123             ║');
    console.log('╚══════════════════════════════════════════════════════════╝');

  } catch (err) {
    console.error('❌ Seeding error:', err.message);
  } finally {
    conn.release();
    process.exit(0);
  }
}

seed();
