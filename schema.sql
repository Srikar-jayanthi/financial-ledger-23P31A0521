CREATE DATABASE IF NOT EXISTS ledger_db;
USE ledger_db;

-- 1. Accounts Table
-- Stores user details. We use VARCHAR(36) for UUIDs.
CREATE TABLE IF NOT EXISTS accounts (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50), -- e.g., 'checking', 'savings'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 2. Transactions Table
-- records the "intent" (e.g., "Transfer $50 from A to B")
CREATE TABLE IF NOT EXISTS transactions (
    id VARCHAR(36) PRIMARY KEY,
    type VARCHAR(50), -- 'transfer', 'deposit', 'withdrawal'
    amount DECIMAL(15, 2) NOT NULL, -- DECIMAL is crucial for money!
    currency VARCHAR(3) DEFAULT 'USD',
    status VARCHAR(20) DEFAULT 'pending', 
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 3. Ledger Table
-- The immutable record. Positive = Credit, Negative = Debit.
CREATE TABLE IF NOT EXISTS ledger (
    id VARCHAR(36) PRIMARY KEY,
    account_id VARCHAR(36),
    transaction_id VARCHAR(36),
    amount DECIMAL(15, 2) NOT NULL,
    type VARCHAR(10), -- 'credit' or 'debit'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (account_id) REFERENCES accounts(id),
    FOREIGN KEY (transaction_id) REFERENCES transactions(id)
) ENGINE=InnoDB;