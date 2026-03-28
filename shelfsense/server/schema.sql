-- ShelfSense Database Schema
-- Run this file to create the database and tables

CREATE DATABASE IF NOT EXISTS shelfsense;
USE shelfsense;

DROP TABLE IF EXISTS fine_requests;
DROP TABLE IF EXISTS reservations;
DROP TABLE IF EXISTS issues;
DROP TABLE IF EXISTS books;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE,
    usn VARCHAR(50) UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('Student', 'Admin') DEFAULT 'Student',
    avatar_url VARCHAR(500) DEFAULT NULL,
    department VARCHAR(100) DEFAULT NULL,
    borrow_limit INT DEFAULT 3,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE books (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    author VARCHAR(255) NOT NULL,
    category VARCHAR(100) DEFAULT 'General',
    quantity INT DEFAULT 1,
    issued_count INT DEFAULT 0,
    floor_num INT DEFAULT 1,
    row_num INT DEFAULT 1,
    rack_num INT DEFAULT 1,
    cover_url VARCHAR(500) DEFAULT NULL,
    isbn VARCHAR(20) DEFAULT NULL,
    year INT DEFAULT NULL,
    description TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE issues (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    book_id INT NOT NULL,
    issue_date DATE NOT NULL,
    due_date DATE NOT NULL,
    return_date DATE DEFAULT NULL,
    fine DECIMAL(10, 2) DEFAULT 0.00,
    status ENUM('Issued', 'Returned', 'Overdue') DEFAULT 'Issued',
    transaction_id VARCHAR(20) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
);

CREATE TABLE reservations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    book_id INT NOT NULL,
    position INT DEFAULT 1,
    status ENUM('Active', 'Notified', 'Fulfilled', 'Expired', 'Cancelled') DEFAULT 'Active',
    notified_at DATETIME DEFAULT NULL,
    expires_at DATETIME DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
);

CREATE TABLE fine_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    issue_id INT NOT NULL,
    reason TEXT NOT NULL,
    amount DECIMAL(10, 2) DEFAULT 0.00,
    status ENUM('Pending', 'Approved', 'Rejected') DEFAULT 'Pending',
    admin_note TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (issue_id) REFERENCES issues(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX idx_issues_user ON issues(user_id);
CREATE INDEX idx_issues_book ON issues(book_id);
CREATE INDEX idx_issues_status ON issues(status);
CREATE INDEX idx_books_category ON books(category);
CREATE INDEX idx_reservations_book ON reservations(book_id);
CREATE INDEX idx_reservations_user ON reservations(user_id);
